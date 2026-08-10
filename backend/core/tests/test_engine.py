from __future__ import annotations

from django.test import SimpleTestCase

from core.engine import (
    FEATURE_COUNT,
    adaptive_rank,
    baseline_rank,
    empty_global_parameters,
    empty_policy_state,
    feature_vector,
    update_personal_policy,
)
from core.jobs import evaluate_parameters, generate_scenarios


class EngineTests(SimpleTestCase):
    input = {
        "signals": ["overstimulated", "racing"],
        "need": "quiet",
        "intensity": 8,
        "capacity": 90,
        "preferences": {"noBreath": True, "eyesOpen": True, "silent": True, "seated": True},
        "immediateDanger": False,
    }

    def test_feature_vector_is_stable_and_25_dimensional(self):
        first = feature_vector(self.input)
        second = feature_vector(self.input)
        self.assertEqual(first.shape, (FEATURE_COUNT,))
        self.assertListEqual(first.tolist(), second.tolist())

    def test_baseline_expected_winner_and_hard_constraints(self):
        result = baseline_rank(self.input)
        self.assertEqual(result["ranked"][0]["id"], "reduce-input")
        longer_out = next(item for item in result["candidates"] if item["id"] == "longer-out")
        self.assertFalse(longer_out["eligible"])
        self.assertIn("breath-focused", longer_out["exclusions"])

    def test_harder_feedback_excludes_the_arm_before_adaptive_scoring(self):
        state = update_personal_policy(empty_policy_state(), self.input, "reduce-input", "harder")
        result = adaptive_rank(self.input, empty_global_parameters(), state)
        rejected = next(item for item in result["candidates"] if item["id"] == "reduce-input")
        self.assertFalse(rejected["eligible"])
        self.assertNotEqual(result["ranked"][0]["id"], "reduce-input")

    def test_adaptive_policy_cannot_restore_excluded_candidates(self):
        parameters = empty_global_parameters()
        parameters["weights"]["longer-out"] = [100.0] * FEATURE_COUNT
        result = adaptive_rank(self.input, parameters)
        longer_out = next(item for item in result["candidates"] if item["id"] == "longer-out")
        self.assertFalse(longer_out["eligible"])
        self.assertNotIn("longer-out", [item["id"] for item in result["ranked"]])

    def test_fixed_safety_corpus_has_zero_constraint_violations(self):
        report = evaluate_parameters(empty_global_parameters(), generate_scenarios(3072, 2026))
        self.assertEqual(report["unsafeSelections"], 0)
        self.assertEqual(report["constraintViolations"], 0)

