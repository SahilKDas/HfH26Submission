from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import numpy as np

MODEL_VERSION = "unspool-adaptive-v3"
BASELINE_VERSION = "unspool-ranker-v2"
FEATURE_COUNT = 25
SIGNALS = ["racing", "tight-chest", "overstimulated", "unreal", "restless", "shutdown", "sad", "shame", "irritable", "numb"]
NEEDS = ["grounding", "quiet", "release", "connection", "clarity", "settle"]
CAPACITIES = [45, 90, 180]
ACCESS_KEYS = ["noBreath", "eyesOpen", "silent", "seated"]

SPEC_PATH = Path(__file__).resolve().parents[2] / "shared" / "practices.json"
DOCUMENT = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
if DOCUMENT["modelVersion"] != BASELINE_VERSION:
    raise RuntimeError("Canonical practice specification version does not match the Python baseline")
PRACTICES: list[dict[str, Any]] = DOCUMENT["practices"]
PRACTICE_IDS = [practice["id"] for practice in PRACTICES]


@dataclass(frozen=True)
class Gate:
    blocked: bool
    level: str
    reason: str | None = None

    def as_dict(self) -> dict[str, Any]:
        value: dict[str, Any] = {"blocked": self.blocked, "level": self.level}
        if self.reason:
            value["reason"] = self.reason
        return value


def safety_gate(value: dict[str, Any]) -> Gate:
    if value.get("immediateDanger"):
        return Gate(True, "urgent", "You said you may not be able to stay safe.")
    signals = value.get("signals")
    if not isinstance(signals, list) or not signals:
        return Gate(True, "input", "Choose at least one signal so the recommendation has context.")
    valid = (
        all(signal in SIGNALS for signal in signals)
        and value.get("need") in NEEDS
        and isinstance(value.get("intensity"), int)
        and 1 <= value["intensity"] <= 10
        and value.get("capacity") in CAPACITIES
        and isinstance(value.get("preferences"), dict)
        and all(isinstance(value["preferences"].get(key), bool) for key in ACCESS_KEYS)
    )
    if not valid:
        return Gate(True, "input", "The check-in contained an unsupported or out-of-range value.")
    return Gate(False, "high" if value["intensity"] >= 9 else "standard")


def _int32(value: int) -> int:
    value &= 0xFFFFFFFF
    return value - 0x100000000 if value >= 0x80000000 else value


def _hash_term(term: str) -> int:
    value = _int32(2166136261)
    for character in term:
        value = _int32(value ^ ord(character))
        value = _int32(value * 16777619)
    return abs(value)


def embed_terms(terms: Iterable[str]) -> np.ndarray:
    vector = np.zeros(32, dtype=float)
    for raw in terms:
        term = str(raw).lower().strip()
        index = _hash_term(term) % 32
        sign = 1 if _hash_term(f"{term}:sign") % 2 == 0 else -1
        vector[index] += sign
    magnitude = float(np.linalg.norm(vector)) or 1.0
    return vector / magnitude


PRACTICE_EMBEDDINGS = {
    practice["id"]: embed_terms([*practice["signals"], *practice["needs"], practice["evidence"]])
    for practice in PRACTICES
}


def feature_vector(value: dict[str, Any]) -> np.ndarray:
    vector: list[float] = [1.0]
    vector.extend(1.0 if signal in value["signals"] else 0.0 for signal in SIGNALS)
    vector.extend(1.0 if value["need"] == need else 0.0 for need in NEEDS)
    vector.append((float(value["intensity"]) - 1.0) / 9.0)
    vector.extend(1.0 if value["capacity"] == capacity else 0.0 for capacity in CAPACITIES)
    vector.extend(1.0 if value["preferences"][key] else 0.0 for key in ACCESS_KEYS)
    result = np.asarray(vector, dtype=float)
    if result.shape != (FEATURE_COUNT,):
        raise RuntimeError(f"Expected {FEATURE_COUNT} model features, received {result.shape[0]}")
    return result


def empty_policy_state() -> dict[str, Any]:
    return {"arms": {}, "counts": {practice_id: {"helpful": 0, "tried": 0, "harder": 0} for practice_id in PRACTICE_IDS}}


def empty_global_parameters() -> dict[str, Any]:
    identity = np.eye(FEATURE_COUNT).tolist()
    return {
        "featureCount": FEATURE_COUNT,
        "weights": {practice_id: [0.0] * FEATURE_COUNT for practice_id in PRACTICE_IDS},
        "inverseCovariance": {practice_id: identity for practice_id in PRACTICE_IDS},
        "alpha": 0.12,
    }


def exclusion_reasons(practice: dict[str, Any], value: dict[str, Any], state: dict[str, Any] | None = None) -> list[str]:
    reasons: list[str] = []
    preferences = value["preferences"]
    if practice["duration"] > value["capacity"]:
        reasons.append("needs more time than available")
    if preferences["noBreath"] and "breath-focused" in practice["constraints"]:
        reasons.append("breath-focused")
    if preferences["eyesOpen"] and "eyes-open" not in practice["modes"]:
        reasons.append("does not support eyes-open use")
    if preferences["silent"] and "silent" not in practice["modes"]:
        reasons.append("does not support silent use")
    if preferences["seated"] and "seated" not in practice["modes"]:
        reasons.append("does not support seated use")
    if value["intensity"] >= 8 and "low-intensity-reflection" in practice["constraints"]:
        reasons.append("reflection excluded at high intensity")
    counts = (state or {}).get("counts", {}).get(practice["id"], {})
    if int(counts.get("harder", 0)) > 0:
        reasons.append("excluded after your harder feedback")
    return reasons


def _base_candidate(practice: dict[str, Any], value: dict[str, Any], gate: Gate, query: np.ndarray, state: dict[str, Any] | None) -> dict[str, Any]:
    matched = [signal for signal in practice["signals"] if signal in value["signals"]]
    signal_score = len(matched) * 1.55
    need_score = 1.8 if value["need"] in practice["needs"] else 0.0
    duration_score = 0.9 if practice["duration"] <= value["capacity"] else 0.0
    intensity_score = 0.7 if practice["intensityRange"][0] <= value["intensity"] <= practice["intensityRange"][1] else -0.5
    semantic_score = max(0.0, float(np.dot(query, PRACTICE_EMBEDDINGS[practice["id"]]))) * 1.25
    exclusions = exclusion_reasons(practice, value, state)
    base_score = signal_score + need_score + duration_score + intensity_score + semantic_score + 0.32
    enabled_preferences = sum(1 for key in ACCESS_KEYS if value["preferences"][key])
    access_reasons = {"breath-focused", "does not support eyes-open use", "does not support silent use", "does not support seated use"}
    return {
        **practice,
        "baseScore": round(base_score, 6),
        "score": round(base_score, 6),
        "eligible": not exclusions,
        "exclusions": exclusions,
        "expectedReward": 0.0,
        "uncertainty": 0.0,
        "learnedComponent": 0.0,
        "explanation": {
            "matchedSignals": matched,
            "needMatched": need_score > 0,
            "capacityFit": duration_score > 0,
            "preferenceFit": enabled_preferences > 0 and not any(reason in access_reasons for reason in exclusions),
            "learning": "active policy has no outcome evidence yet",
            "evidence": practice["evidence"],
            "components": {
                "signal": round(signal_score, 4),
                "need": round(need_score, 4),
                "duration": round(duration_score, 4),
                "intensity": round(intensity_score, 4),
                "semantic": round(semantic_score, 4),
                "learning": 0.0,
            },
        },
    }


def baseline_rank(value: dict[str, Any], state: dict[str, Any] | None = None) -> dict[str, Any]:
    gate = safety_gate(value)
    if gate.blocked:
        return {"modelVersion": BASELINE_VERSION, "gate": gate.as_dict(), "ranked": [], "candidates": []}
    query = embed_terms([*value["signals"], value["need"], gate.level])
    candidates = [_base_candidate(practice, value, gate, query, state) for practice in PRACTICES]
    ranked = sorted((item for item in candidates if item["eligible"]), key=lambda item: (-item["score"], item["id"]))
    if not ranked:
        gate = Gate(True, "options", "No practice fits every current access and time constraint. Change one setting or reset harder feedback to start fresh.")
    return {"modelVersion": BASELINE_VERSION, "gate": gate.as_dict(), "ranked": ranked, "candidates": candidates}


def _personal_estimate(practice_id: str, vector: np.ndarray, state: dict[str, Any]) -> tuple[float, float]:
    arm = state.get("arms", {}).get(practice_id)
    if not arm:
        return 0.0, 1.0
    matrix = np.asarray(arm["A"], dtype=float)
    target = np.asarray(arm["b"], dtype=float)
    theta = np.linalg.solve(matrix, target)
    solved = np.linalg.solve(matrix, vector)
    return float(vector @ theta), math.sqrt(max(0.0, float(vector @ solved)))


def adaptive_rank(value: dict[str, Any], parameters: dict[str, Any] | None = None, state: dict[str, Any] | None = None) -> dict[str, Any]:
    baseline = baseline_rank(value, state)
    if baseline["gate"]["blocked"]:
        return {**baseline, "modelVersion": MODEL_VERSION, "policySource": "adaptive-v3", "decisionMargin": 0.0}
    parameters = parameters or empty_global_parameters()
    state = state or empty_policy_state()
    vector = feature_vector(value)
    alpha = float(parameters.get("alpha", 0.12))
    for candidate in baseline["candidates"]:
        if not candidate["eligible"]:
            continue
        practice_id = candidate["id"]
        weights = np.asarray(parameters["weights"].get(practice_id, [0.0] * FEATURE_COUNT), dtype=float)
        inverse = np.asarray(parameters["inverseCovariance"].get(practice_id, np.eye(FEATURE_COUNT)), dtype=float)
        global_mean = float(vector @ weights)
        global_uncertainty = math.sqrt(max(0.0, float(vector @ inverse @ vector)))
        personal_mean, personal_uncertainty = _personal_estimate(practice_id, vector, state)
        expected = 0.6 * global_mean + 0.4 * personal_mean
        uncertainty = min(2.0, 0.6 * global_uncertainty + 0.4 * personal_uncertainty)
        learned = 1.25 * expected + alpha * uncertainty
        candidate["expectedReward"] = round(expected, 6)
        candidate["uncertainty"] = round(uncertainty, 6)
        candidate["learnedComponent"] = round(learned, 6)
        candidate["score"] = round(float(candidate["baseScore"]) + learned, 6)
        candidate["explanation"]["learning"] = "personal and active-policy outcome evidence" if state.get("arms") else "active-policy outcome evidence"
        candidate["explanation"]["components"]["learning"] = round(learned, 4)
    ranked = sorted((item for item in baseline["candidates"] if item["eligible"]), key=lambda item: (-item["score"], item["id"]))
    margin = round(ranked[0]["score"] - ranked[1]["score"], 6) if len(ranked) > 1 else 0.0
    clarity = "clear" if margin >= 0.75 else "close"
    return {
        "modelVersion": MODEL_VERSION,
        "policySource": "adaptive-v3",
        "gate": baseline["gate"],
        "ranked": ranked,
        "candidates": baseline["candidates"],
        "decisionMargin": margin,
        "decisionClarity": clarity,
    }


def update_personal_policy(state: dict[str, Any], context: dict[str, Any], practice_id: str, outcome: str | None) -> dict[str, Any]:
    result = json.loads(json.dumps(state or empty_policy_state()))
    if outcome not in {"helped", "same", "harder"}:
        return result
    reward = {"helped": 1.0, "same": 0.0, "harder": -1.0}[outcome]
    vector = feature_vector(context)
    arm = result.setdefault("arms", {}).setdefault(practice_id, {"A": np.eye(FEATURE_COUNT).tolist(), "b": [0.0] * FEATURE_COUNT})
    matrix = np.asarray(arm["A"], dtype=float) + np.outer(vector, vector)
    target = np.asarray(arm["b"], dtype=float) + reward * vector
    arm["A"] = matrix.round(8).tolist()
    arm["b"] = target.round(8).tolist()
    counts = result.setdefault("counts", {}).setdefault(practice_id, {"helpful": 0, "tried": 0, "harder": 0})
    counts["tried"] = int(counts.get("tried", 0)) + 1
    if outcome == "helped":
        counts["helpful"] = int(counts.get("helpful", 0)) + 1
    if outcome == "harder":
        counts["harder"] = int(counts.get("harder", 0)) + 1
    return result


def public_candidate(candidate: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in candidate.items() if key not in {"signals", "needs", "modes", "intensityRange", "constraints", "evidence"}}
