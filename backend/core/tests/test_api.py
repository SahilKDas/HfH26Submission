from __future__ import annotations

import uuid

from django.test import TestCase
from rest_framework.test import APIClient

from core.models import AnonymousProfile, OutcomeEvent, RecommendationDecision


class AdaptiveApiTests(TestCase):
    input = {
        "signals": ["overstimulated", "racing"],
        "need": "quiet",
        "intensity": 8,
        "capacity": 90,
        "preferences": {"noBreath": True, "eyesOpen": True, "silent": True, "seated": True},
        "immediateDanger": False,
    }

    def setUp(self):
        self.client = APIClient()

    def test_unconsented_inference_is_transient(self):
        response = self.client.post("/api/v1/recommendations", self.input, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["decisionId"])
        self.assertEqual(response.data["selected"]["id"], "reduce-input")
        self.assertEqual(RecommendationDecision.objects.count(), 0)

    def test_consent_decision_idempotent_outcome_and_delete(self):
        consent = self.client.post("/api/v1/profile/consent", {}, format="json")
        self.assertEqual(consent.status_code, 201)
        recommendation = self.client.post("/api/v1/recommendations", self.input, format="json")
        decision_id = recommendation.data["decisionId"]
        self.assertIsNotNone(decision_id)
        key = str(uuid.uuid4())
        payload = {"idempotencyKey": key, "outcome": "helped", "after": 4, "completed": True, "elapsedSeconds": 45}
        first = self.client.post(f"/api/v1/decisions/{decision_id}/outcome", payload, format="json")
        second = self.client.post(f"/api/v1/decisions/{decision_id}/outcome", payload, format="json")
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(OutcomeEvent.objects.count(), 1)
        insights = self.client.get("/api/v1/profile/insights")
        self.assertTrue(insights.data["consented"])
        self.assertEqual(insights.data["sessions"][0]["outcome"], "helped")
        deleted = self.client.delete("/api/v1/profile")
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(AnonymousProfile.objects.count(), 0)
        self.assertEqual(RecommendationDecision.objects.count(), 0)

    def test_crisis_signal_bypasses_ranking_and_storage(self):
        value = {**self.input, "immediateDanger": True}
        response = self.client.post("/api/v1/recommendations", value, format="json")
        self.assertEqual(response.data["gate"]["level"], "urgent")
        self.assertIsNone(response.data["selected"])

    def test_rejects_unbounded_input(self):
        response = self.client.post("/api/v1/recommendations", {**self.input, "intensity": 99}, format="json")
        self.assertEqual(response.status_code, 400)

