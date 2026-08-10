from __future__ import annotations

import hashlib
import math
from datetime import timedelta
from typing import Any

import numpy as np
from django.db import connection, transaction
from django.utils import timezone

from core.engine import (
    ACCESS_KEYS,
    CAPACITIES,
    FEATURE_COUNT,
    MODEL_VERSION,
    NEEDS,
    PRACTICE_IDS,
    SIGNALS,
    adaptive_rank,
    baseline_rank,
    empty_global_parameters,
    feature_vector,
)
from core.models import EvaluationJob, ModelSnapshot, OutcomeEvent


def _random_sequence(seed: int):
    state = seed & 0xFFFFFFFF
    while True:
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        yield state / 0x100000000


def generate_scenarios(count: int, seed: int) -> list[dict[str, Any]]:
    scenarios: list[dict[str, Any]] = []
    for index in range(count):
        mask = (index * 13 + seed) % 16
        primary = SIGNALS[(index + seed) % len(SIGNALS)]
        secondary = SIGNALS[(index * 7 + 3 + seed) % len(SIGNALS)]
        scenarios.append({
            "id": f"synthetic-{seed}-{index:05d}",
            "signals": [primary] if primary == secondary else [primary, secondary],
            "need": NEEDS[(index // len(SIGNALS) + seed) % len(NEEDS)],
            "intensity": 1 + ((index // (len(SIGNALS) * len(NEEDS)) + seed) % 10),
            "capacity": CAPACITIES[(index * 7 + seed) % len(CAPACITIES)],
            "preferences": {key: bool(mask & (1 << bit)) for bit, key in enumerate(ACCESS_KEYS)},
            "immediateDanger": False,
        })
    random = _random_sequence(seed)
    for index in range(len(scenarios) - 1, 0, -1):
        target = int(next(random) * (index + 1))
        scenarios[index], scenarios[target] = scenarios[target], scenarios[index]
    return scenarios


def _latent_weights(practice_id: str) -> np.ndarray:
    values = []
    for index in range(FEATURE_COUNT):
        fingerprint = f"{practice_id}:{index}:synthetic-environment-v2".encode()
        values.append((int(hashlib.sha256(fingerprint).hexdigest()[:8], 16) / 0xFFFFFFFF - 0.5) * 2.0)
    return np.asarray(values, dtype=float)


LATENT_WEIGHTS = {practice_id: _latent_weights(practice_id) for practice_id in PRACTICE_IDS}


def synthetic_reward(context: dict[str, Any], candidate: dict[str, Any]) -> float:
    vector = feature_vector(context)
    latent = float(vector @ LATENT_WEIGHTS[candidate["id"]]) / max(1.0, float(np.linalg.norm(vector)))
    evidence_prior = (float(candidate["baseScore"]) - 4.0) * 0.08
    return float(np.clip(math.tanh(evidence_prior + latent), -1.0, 1.0))


def _fit_events(events: list[tuple[dict[str, Any], str, float]]) -> dict[str, Any]:
    matrices = {practice_id: np.eye(FEATURE_COUNT) for practice_id in PRACTICE_IDS}
    targets = {practice_id: np.zeros(FEATURE_COUNT) for practice_id in PRACTICE_IDS}
    for context, practice_id, reward in events:
        vector = feature_vector(context)
        matrices[practice_id] += np.outer(vector, vector)
        targets[practice_id] += reward * vector
    parameters = empty_global_parameters()
    for practice_id in PRACTICE_IDS:
        parameters["weights"][practice_id] = np.linalg.solve(matrices[practice_id], targets[practice_id]).round(10).tolist()
        parameters["inverseCovariance"][practice_id] = np.linalg.inv(matrices[practice_id]).round(10).tolist()
    return parameters


def evaluate_parameters(parameters: dict[str, Any], scenarios: list[dict[str, Any]]) -> dict[str, Any]:
    violations = 0
    unsafe = 0
    distribution = {practice_id: 0 for practice_id in PRACTICE_IDS}
    margins: list[float] = []
    for context in scenarios:
        result = adaptive_rank(context, parameters)
        winner = result["ranked"][0] if result["ranked"] else None
        if not winner:
            unsafe += 1
            violations += 1
            continue
        distribution[winner["id"]] += 1
        margins.append(float(result["decisionMargin"]))
        if winner["exclusions"]:
            violations += len(winner["exclusions"])
    sorted_margins = sorted(margins)
    return {
        "unsafeSelections": unsafe,
        "constraintViolations": violations,
        "selectionDistribution": distribution,
        "practiceCoverage": sum(1 for count in distribution.values() if count > 0),
        "decisionMargin": {
            "minimum": round(sorted_margins[0] if sorted_margins else 0.0, 6),
            "mean": round(sum(margins) / len(margins) if margins else 0.0, 6),
            "p05": round(sorted_margins[int((len(sorted_margins) - 1) * 0.05)] if sorted_margins else 0.0, 6),
        },
    }


def run_simulation(job: EvaluationJob) -> dict[str, Any]:
    job.progress = 8
    job.save(update_fields=["progress"])
    training = generate_scenarios(12_288, job.seed)
    events: list[tuple[dict[str, Any], str, float]] = []
    for index, context in enumerate(training):
        baseline = baseline_rank(context)
        eligible = baseline["ranked"]
        if not eligible:
            continue
        candidate = eligible[(index + job.seed) % len(eligible)]
        events.append((context, candidate["id"], synthetic_reward(context, candidate)))
    job.progress = 42
    job.save(update_fields=["progress"])
    parameters = _fit_events(events)
    holdout = generate_scenarios(3_072, job.seed + 1)
    baseline_rewards: list[float] = []
    challenger_rewards: list[float] = []
    oracle_rewards: list[float] = []
    for context in holdout:
        baseline = baseline_rank(context)
        challenger = adaptive_rank(context, parameters)
        eligible = baseline["ranked"]
        if not eligible or not challenger["ranked"]:
            continue
        baseline_rewards.append(synthetic_reward(context, eligible[0]))
        challenger_rewards.append(synthetic_reward(context, challenger["ranked"][0]))
        oracle_rewards.append(max(synthetic_reward(context, candidate) for candidate in eligible))
    job.progress = 78
    job.save(update_fields=["progress"])
    safety = evaluate_parameters(parameters, holdout)
    baseline_mean = sum(baseline_rewards) / max(1, len(baseline_rewards))
    challenger_mean = sum(challenger_rewards) / max(1, len(challenger_rewards))
    oracle_mean = sum(oracle_rewards) / max(1, len(oracle_rewards))
    return {
        "schemaVersion": 1,
        "modelVersion": MODEL_VERSION,
        "seed": job.seed,
        "generatedAt": timezone.now().isoformat(),
        "synthetic": True,
        "trainingInteractions": len(events),
        "evaluationScenarios": len(holdout),
        "featureCount": FEATURE_COUNT,
        "baselineReward": round(baseline_mean, 6),
        "challengerReward": round(challenger_mean, 6),
        "simulatedImprovement": round(challenger_mean - baseline_mean, 6),
        "challengerRegret": round(oracle_mean - challenger_mean, 6),
        **safety,
        "passed": safety["unsafeSelections"] == 0 and safety["constraintViolations"] == 0,
        "limitations": [
            "This isolated synthetic environment demonstrates model-learning behavior, not clinical effectiveness.",
            "Synthetic interactions never enter the production policy or outcome database.",
        ],
    }


def run_training(job: EvaluationJob) -> dict[str, Any]:
    queryset = OutcomeEvent.objects.exclude(outcome__isnull=True).select_related("decision").order_by("created_at")
    events: list[tuple[dict[str, Any], str, float]] = []
    rewards = {"helped": 1.0, "same": 0.0, "harder": -1.0}
    for event in queryset.iterator():
        events.append((event.decision.context, event.decision.selected_practice, rewards[event.outcome]))
    parameters = _fit_events(events)
    safety = evaluate_parameters(parameters, generate_scenarios(3_072, job.seed))
    active = ModelSnapshot.objects.filter(status=ModelSnapshot.Status.ACTIVE).order_by("-promoted_at").first()
    version = f"{MODEL_VERSION}.{timezone.now().strftime('%Y%m%d%H%M%S')}"
    promotable = safety["unsafeSelections"] == 0 and safety["constraintViolations"] == 0 and safety["practiceCoverage"] >= 6
    ModelSnapshot.objects.create(
        version=version,
        status=ModelSnapshot.Status.CANDIDATE if promotable else ModelSnapshot.Status.REJECTED,
        parameters=parameters,
        metrics={**safety, "promotable": promotable},
        training_event_count=len(events),
        parent_version=active.version if active else "",
    )
    return {"schemaVersion": 1, "modelVersion": version, "trainingInteractions": len(events), "synthetic": False, **safety, "promotable": promotable}


def claim_job() -> EvaluationJob | None:
    with transaction.atomic():
        queryset = EvaluationJob.objects.filter(status=EvaluationJob.Status.QUEUED).order_by("created_at")
        if connection.vendor == "postgresql":
            queryset = queryset.select_for_update(skip_locked=True)
        else:
            queryset = queryset.select_for_update()
        job = queryset.first()
        if not job:
            return None
        job.status = EvaluationJob.Status.RUNNING
        job.started_at = timezone.now()
        job.progress = 1
        job.attempts += 1
        job.save(update_fields=["status", "started_at", "progress", "attempts"])
        return job


def recover_stale_jobs() -> int:
    cutoff = timezone.now() - timedelta(minutes=10)
    return EvaluationJob.objects.filter(status=EvaluationJob.Status.RUNNING, started_at__lt=cutoff).update(
        status=EvaluationJob.Status.QUEUED, progress=0, error="Recovered after worker interruption."
    )


def run_one_job() -> bool:
    job = claim_job()
    if not job:
        return False
    try:
        report = run_simulation(job) if job.kind == EvaluationJob.Kind.SIMULATION else run_training(job)
        job.status = EvaluationJob.Status.COMPLETED
        job.progress = 100
        job.report = report
        job.error = ""
    except Exception as error:
        job.status = EvaluationJob.Status.FAILED
        job.error = f"{type(error).__name__}: {error}"[:2000]
    job.finished_at = timezone.now()
    job.save(update_fields=["status", "progress", "report", "error", "finished_at"])
    return True
