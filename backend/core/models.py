from __future__ import annotations

import uuid

from django.db import models


class AnonymousProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    credential_hash = models.CharField(max_length=64, unique=True)
    consented_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Anonymous profile {str(self.id)[:8]}"


class PersonalPolicy(models.Model):
    profile = models.OneToOneField(AnonymousProfile, on_delete=models.CASCADE, related_name="policy")
    state = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)


class ModelSnapshot(models.Model):
    class Status(models.TextChoices):
        BASELINE = "baseline", "Baseline"
        CANDIDATE = "candidate", "Candidate"
        ACTIVE = "active", "Active"
        REJECTED = "rejected", "Rejected"

    version = models.CharField(max_length=80, unique=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.BASELINE)
    parameters = models.JSONField(default=dict)
    metrics = models.JSONField(default=dict)
    training_event_count = models.PositiveIntegerField(default=0)
    parent_version = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    promoted_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"{self.version} ({self.status})"


class RecommendationDecision(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(AnonymousProfile, on_delete=models.CASCADE, related_name="decisions")
    model_version = models.CharField(max_length=80)
    context = models.JSONField()
    selected_practice = models.CharField(max_length=80)
    candidates = models.JSONField(default=list)
    trace = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    outcome_recorded = models.BooleanField(default=False)


class OutcomeEvent(models.Model):
    class Outcome(models.TextChoices):
        HELPED = "helped", "Helped"
        SAME = "same", "Same"
        HARDER = "harder", "Harder"

    decision = models.OneToOneField(RecommendationDecision, on_delete=models.CASCADE, related_name="outcome_event")
    idempotency_key = models.UUIDField(unique=True)
    outcome = models.CharField(max_length=8, choices=Outcome.choices, null=True, blank=True)
    after = models.PositiveSmallIntegerField(null=True, blank=True)
    completed = models.BooleanField()
    elapsed_seconds = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


class EvaluationJob(models.Model):
    class Kind(models.TextChoices):
        SIMULATION = "simulation", "Synthetic simulation"
        TRAINING = "training", "Production challenger"

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=16, choices=Kind.choices)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.QUEUED)
    fingerprint = models.CharField(max_length=128, db_index=True)
    seed = models.PositiveIntegerField(default=2026)
    progress = models.PositiveSmallIntegerField(default=0)
    report = models.JSONField(default=dict)
    error = models.TextField(blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["status", "created_at"], name="core_evalua_status_7f2e04_idx")]
