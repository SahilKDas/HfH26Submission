from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import timedelta
from typing import Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import serializers, status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.engine import (
    ACCESS_KEYS,
    CAPACITIES,
    FEATURE_COUNT,
    MODEL_VERSION,
    NEEDS,
    SIGNALS,
    adaptive_rank,
    empty_global_parameters,
    empty_policy_state,
    public_candidate,
    update_personal_policy,
)
from core.models import AnonymousProfile, EvaluationJob, ModelSnapshot, OutcomeEvent, PersonalPolicy, RecommendationDecision


class PreferencesSerializer(serializers.Serializer):
    noBreath = serializers.BooleanField()
    eyesOpen = serializers.BooleanField()
    silent = serializers.BooleanField()
    seated = serializers.BooleanField()


class RecommendationSerializer(serializers.Serializer):
    signals = serializers.ListField(child=serializers.ChoiceField(choices=SIGNALS), min_length=1, max_length=len(SIGNALS))
    need = serializers.ChoiceField(choices=NEEDS)
    intensity = serializers.IntegerField(min_value=1, max_value=10)
    capacity = serializers.ChoiceField(choices=CAPACITIES)
    preferences = PreferencesSerializer()
    immediateDanger = serializers.BooleanField(default=False)

    def validate_signals(self, value):
        if len(set(value)) != len(value):
            raise serializers.ValidationError("Signals must be unique.")
        return value


class OutcomeSerializer(serializers.Serializer):
    idempotencyKey = serializers.UUIDField()
    outcome = serializers.ChoiceField(choices=["helped", "same", "harder"], allow_null=True)
    after = serializers.IntegerField(min_value=1, max_value=10, allow_null=True)
    completed = serializers.BooleanField()
    elapsedSeconds = serializers.IntegerField(min_value=0, max_value=3600)


def _credential_hash(secret: str) -> str:
    return hashlib.sha256(f"{secret}:{settings.SECRET_KEY}".encode()).hexdigest()


def request_profile(request) -> AnonymousProfile | None:
    raw = request.COOKIES.get(settings.PROFILE_COOKIE_NAME, "")
    try:
        profile_id, secret = raw.split(".", 1)
        profile = AnonymousProfile.objects.get(pk=uuid.UUID(profile_id))
    except (ValueError, AnonymousProfile.DoesNotExist):
        return None
    if not secrets.compare_digest(profile.credential_hash, _credential_hash(secret)):
        return None
    return profile


def active_snapshot() -> ModelSnapshot:
    active = ModelSnapshot.objects.filter(status=ModelSnapshot.Status.ACTIVE).order_by("-promoted_at", "-created_at").first()
    if active:
        return active
    snapshot, _ = ModelSnapshot.objects.get_or_create(
        version=f"{MODEL_VERSION}.0",
        defaults={
            "status": ModelSnapshot.Status.ACTIVE,
            "parameters": empty_global_parameters(),
            "metrics": {"constraintViolations": 0, "unsafeSelections": 0, "practiceCoverage": 8},
            "promoted_at": timezone.now(),
        },
    )
    if snapshot.status != ModelSnapshot.Status.ACTIVE:
        snapshot.status = ModelSnapshot.Status.ACTIVE
        snapshot.promoted_at = timezone.now()
        snapshot.save(update_fields=["status", "promoted_at"])
    return snapshot


def purge_expired_events() -> int:
    cutoff = timezone.now() - timedelta(days=settings.DATA_RETENTION_DAYS)
    deleted, _ = RecommendationDecision.objects.filter(created_at__lt=cutoff).delete()
    return deleted


@api_view(["POST"])
@csrf_protect
def profile_consent(request):
    existing = request_profile(request)
    if existing:
        return Response({"consented": True, "retentionDays": settings.DATA_RETENTION_DAYS})
    secret = secrets.token_urlsafe(32)
    profile = AnonymousProfile.objects.create(credential_hash=_credential_hash(secret), consented_at=timezone.now())
    PersonalPolicy.objects.create(profile=profile, state=empty_policy_state())
    response = Response({"consented": True, "retentionDays": settings.DATA_RETENTION_DAYS}, status=status.HTTP_201_CREATED)
    response.set_cookie(
        settings.PROFILE_COOKIE_NAME,
        f"{profile.id}.{secret}",
        max_age=settings.PROFILE_COOKIE_MAX_AGE,
        secure=settings.PROFILE_COOKIE_SECURE,
        httponly=True,
        samesite="Lax",
        path="/",
    )
    return response


@api_view(["DELETE"])
@csrf_protect
def profile_delete(request):
    profile = request_profile(request)
    if profile:
        profile.delete()
    response = Response(status=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(settings.PROFILE_COOKIE_NAME, path="/", samesite="Lax")
    return response


@api_view(["GET"])
@ensure_csrf_cookie
def profile_insights(request):
    purge_expired_events()
    profile = request_profile(request)
    if not profile:
        return Response({"consented": False, "sessions": [], "policy": empty_policy_state()["counts"], "retentionDays": settings.DATA_RETENTION_DAYS})
    policy, _ = PersonalPolicy.objects.get_or_create(profile=profile, defaults={"state": empty_policy_state()})
    decisions = RecommendationDecision.objects.filter(profile=profile).select_related("outcome_event").order_by("-created_at")[:30]
    sessions = []
    for decision in decisions:
        try:
            event = decision.outcome_event
        except OutcomeEvent.DoesNotExist:
            event = None
        context = decision.context
        sessions.append({
            "id": str(decision.id),
            "createdAt": decision.created_at.isoformat(),
            "practiceId": decision.selected_practice,
            "signals": context.get("signals", []),
            "need": context.get("need"),
            "before": context.get("intensity"),
            "after": event.after if event else None,
            "outcome": event.outcome if event else None,
            "completed": event.completed if event else False,
            "modelVersion": decision.model_version,
        })
    return Response({"consented": True, "sessions": sessions, "policy": policy.state.get("counts", {}), "retentionDays": settings.DATA_RETENTION_DAYS})


@api_view(["POST"])
@csrf_protect
def recommendations(request):
    serializer = RecommendationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    context = dict(serializer.validated_data)
    context["preferences"] = dict(context["preferences"])
    profile = request_profile(request)
    policy_state = empty_policy_state()
    if profile:
        policy, _ = PersonalPolicy.objects.get_or_create(profile=profile, defaults={"state": policy_state})
        policy_state = policy.state or policy_state
    snapshot = active_snapshot()
    result = adaptive_rank(context, snapshot.parameters, policy_state)
    selected = result["ranked"][0] if result["ranked"] else None
    decision_id = None
    if profile and selected and not result["gate"]["blocked"]:
        decision = RecommendationDecision.objects.create(
            profile=profile,
            model_version=snapshot.version,
            context=context,
            selected_practice=selected["id"],
            candidates=[public_candidate(item) for item in result["candidates"]],
            trace={"decisionMargin": result["decisionMargin"], "decisionClarity": result["decisionClarity"], "featureCount": FEATURE_COUNT},
            expires_at=timezone.now() + timedelta(days=settings.DATA_RETENTION_DAYS),
        )
        decision_id = str(decision.id)
    return Response({
        "decisionId": decision_id,
        "modelVersion": snapshot.version,
        "policySource": "adaptive-v3",
        "gate": result["gate"],
        "selected": public_candidate(selected) if selected else None,
        "candidates": [public_candidate(item) for item in result["candidates"]],
        "decisionMargin": result.get("decisionMargin", 0.0),
        "decisionClarity": result.get("decisionClarity", "close"),
        "learningEnabled": profile is not None,
    })


@api_view(["POST"])
@csrf_protect
def record_outcome(request, decision_id: uuid.UUID):
    serializer = OutcomeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    profile = request_profile(request)
    if not profile:
        return Response({"error": {"detail": "Adaptive learning consent is required."}}, status=status.HTTP_403_FORBIDDEN)
    with transaction.atomic():
        try:
            decision = RecommendationDecision.objects.select_for_update().get(pk=decision_id, profile=profile)
        except RecommendationDecision.DoesNotExist:
            return Response({"error": {"detail": "Decision was not found or has expired."}}, status=status.HTTP_404_NOT_FOUND)
        existing = OutcomeEvent.objects.filter(idempotency_key=serializer.validated_data["idempotencyKey"]).first()
        if existing:
            return Response({"recorded": True, "idempotent": True})
        if decision.outcome_recorded:
            return Response({"error": {"detail": "This decision already has an outcome."}}, status=status.HTTP_409_CONFLICT)
        event = OutcomeEvent.objects.create(
            decision=decision,
            idempotency_key=serializer.validated_data["idempotencyKey"],
            outcome=serializer.validated_data["outcome"],
            after=serializer.validated_data["after"],
            completed=serializer.validated_data["completed"],
            elapsed_seconds=serializer.validated_data["elapsedSeconds"],
        )
        policy = PersonalPolicy.objects.select_for_update().get(profile=profile)
        policy.state = update_personal_policy(policy.state, decision.context, decision.selected_practice, event.outcome)
        policy.save(update_fields=["state", "updated_at"])
        decision.outcome_recorded = True
        decision.save(update_fields=["outcome_recorded"])
    if event.outcome and OutcomeEvent.objects.exclude(outcome__isnull=True).count() >= settings.MINIMUM_CHALLENGER_OUTCOMES:
        latest = ModelSnapshot.objects.filter(status__in=[ModelSnapshot.Status.CANDIDATE, ModelSnapshot.Status.ACTIVE]).order_by("-training_event_count").first()
        count = OutcomeEvent.objects.exclude(outcome__isnull=True).count()
        if count - (latest.training_event_count if latest else 0) >= settings.MINIMUM_CHALLENGER_OUTCOMES:
            EvaluationJob.objects.get_or_create(
                kind=EvaluationJob.Kind.TRAINING,
                status=EvaluationJob.Status.QUEUED,
                defaults={"fingerprint": f"training-{count}", "seed": 2026},
            )
    return Response({"recorded": True, "idempotent": False}, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@ensure_csrf_cookie
def model_status(request):
    snapshot = active_snapshot()
    last = EvaluationJob.objects.filter(status=EvaluationJob.Status.COMPLETED).order_by("-finished_at").first()
    retained = OutcomeEvent.objects.exclude(outcome__isnull=True).count()
    candidate = ModelSnapshot.objects.filter(status=ModelSnapshot.Status.CANDIDATE).order_by("-created_at").first()
    return Response({
        "activeModel": snapshot.version,
        "baselineModel": "unspool-ranker-v2",
        "retainedOutcomeCount": retained,
        "minimumForChallenger": settings.MINIMUM_CHALLENGER_OUTCOMES,
        "featureCount": FEATURE_COUNT,
        "lastEvaluation": last.finished_at.isoformat() if last and last.finished_at else None,
        "promotionState": "candidate" if candidate else snapshot.status,
        "metrics": snapshot.metrics,
    })


@api_view(["POST"])
@csrf_protect
def simulations(request):
    seed = 2026
    fingerprint = f"simulation-{MODEL_VERSION}-{seed}-12288-3072"
    cutoff = timezone.now() - timedelta(minutes=10)
    cached = EvaluationJob.objects.filter(fingerprint=fingerprint, status=EvaluationJob.Status.COMPLETED, finished_at__gte=cutoff).order_by("-finished_at").first()
    if cached:
        return Response(job_payload(cached))
    active = EvaluationJob.objects.filter(fingerprint=fingerprint, status__in=[EvaluationJob.Status.QUEUED, EvaluationJob.Status.RUNNING]).order_by("created_at").first()
    job = active or EvaluationJob.objects.create(kind=EvaluationJob.Kind.SIMULATION, fingerprint=fingerprint, seed=seed)
    return Response(job_payload(job), status=status.HTTP_202_ACCEPTED)


def job_payload(job: EvaluationJob) -> dict[str, Any]:
    value: dict[str, Any] = {
        "jobId": str(job.id),
        "status": job.status,
        "progress": job.progress,
        "modelVersion": MODEL_VERSION,
        "kind": job.kind,
    }
    if job.status == EvaluationJob.Status.COMPLETED:
        value["report"] = job.report
    if job.status == EvaluationJob.Status.FAILED:
        value["message"] = "The model worker could not complete this run. Retry is safe."
    return value


@api_view(["GET"])
@ensure_csrf_cookie
def job_detail(request, job_id: uuid.UUID):
    try:
        job = EvaluationJob.objects.get(pk=job_id)
    except EvaluationJob.DoesNotExist:
        return Response({"error": {"detail": "Job was not found."}}, status=status.HTTP_404_NOT_FOUND)
    return Response(job_payload(job))
