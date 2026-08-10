from __future__ import annotations

import uuid

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name="AnonymousProfile", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("credential_hash", models.CharField(max_length=64, unique=True)),
            ("consented_at", models.DateTimeField()),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("last_seen_at", models.DateTimeField(auto_now=True)),
        ]),
        migrations.CreateModel(name="EvaluationJob", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("kind", models.CharField(choices=[("simulation", "Synthetic simulation"), ("training", "Production challenger")], max_length=16)),
            ("status", models.CharField(choices=[("queued", "Queued"), ("running", "Running"), ("completed", "Completed"), ("failed", "Failed")], default="queued", max_length=16)),
            ("fingerprint", models.CharField(db_index=True, max_length=128)),
            ("seed", models.PositiveIntegerField(default=2026)),
            ("progress", models.PositiveSmallIntegerField(default=0)),
            ("report", models.JSONField(default=dict)),
            ("error", models.TextField(blank=True)),
            ("attempts", models.PositiveSmallIntegerField(default=0)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("started_at", models.DateTimeField(blank=True, null=True)),
            ("finished_at", models.DateTimeField(blank=True, null=True)),
        ], options={"indexes": [models.Index(fields=["status", "created_at"], name="core_evalua_status_7f2e04_idx")]}),
        migrations.CreateModel(name="ModelSnapshot", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("version", models.CharField(max_length=80, unique=True)),
            ("status", models.CharField(choices=[("baseline", "Baseline"), ("candidate", "Candidate"), ("active", "Active"), ("rejected", "Rejected")], default="baseline", max_length=16)),
            ("parameters", models.JSONField(default=dict)),
            ("metrics", models.JSONField(default=dict)),
            ("training_event_count", models.PositiveIntegerField(default=0)),
            ("parent_version", models.CharField(blank=True, max_length=80)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("promoted_at", models.DateTimeField(blank=True, null=True)),
        ]),
        migrations.CreateModel(name="PersonalPolicy", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("state", models.JSONField(default=dict)),
            ("updated_at", models.DateTimeField(auto_now=True)),
            ("profile", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="policy", to="core.anonymousprofile")),
        ]),
        migrations.CreateModel(name="RecommendationDecision", fields=[
            ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
            ("model_version", models.CharField(max_length=80)),
            ("context", models.JSONField()),
            ("selected_practice", models.CharField(max_length=80)),
            ("candidates", models.JSONField(default=list)),
            ("trace", models.JSONField(default=dict)),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("expires_at", models.DateTimeField()),
            ("outcome_recorded", models.BooleanField(default=False)),
            ("profile", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="decisions", to="core.anonymousprofile")),
        ]),
        migrations.CreateModel(name="OutcomeEvent", fields=[
            ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
            ("idempotency_key", models.UUIDField(unique=True)),
            ("outcome", models.CharField(blank=True, choices=[("helped", "Helped"), ("same", "Same"), ("harder", "Harder")], max_length=8, null=True)),
            ("after", models.PositiveSmallIntegerField(blank=True, null=True)),
            ("completed", models.BooleanField()),
            ("elapsed_seconds", models.PositiveIntegerField()),
            ("created_at", models.DateTimeField(auto_now_add=True)),
            ("decision", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="outcome_event", to="core.recommendationdecision")),
        ]),
    ]
