from __future__ import annotations

from django.contrib import admin, messages
from django.utils import timezone

from core.models import AnonymousProfile, EvaluationJob, ModelSnapshot, OutcomeEvent, PersonalPolicy, RecommendationDecision


@admin.register(ModelSnapshot)
class ModelSnapshotAdmin(admin.ModelAdmin):
    list_display = ("version", "status", "training_event_count", "created_at", "promoted_at")
    readonly_fields = ("version", "parameters", "metrics", "training_event_count", "parent_version", "created_at", "promoted_at")
    actions = ["promote_candidates"]

    @admin.action(description="Promote selected safe candidate")
    def promote_candidates(self, request, queryset):
        if queryset.count() != 1:
            self.message_user(request, "Select exactly one candidate.", level=messages.ERROR)
            return
        candidate = queryset.first()
        metrics = candidate.metrics or {}
        if candidate.status != ModelSnapshot.Status.CANDIDATE or metrics.get("constraintViolations") != 0 or metrics.get("unsafeSelections") != 0:
            self.message_user(request, "Only a candidate with zero safety and constraint violations can be promoted.", level=messages.ERROR)
            return
        ModelSnapshot.objects.filter(status=ModelSnapshot.Status.ACTIVE).update(status=ModelSnapshot.Status.BASELINE)
        candidate.status = ModelSnapshot.Status.ACTIVE
        candidate.promoted_at = timezone.now()
        candidate.save(update_fields=["status", "promoted_at"])
        self.message_user(request, f"Promoted {candidate.version}.", level=messages.SUCCESS)


@admin.register(EvaluationJob)
class EvaluationJobAdmin(admin.ModelAdmin):
    list_display = ("id", "kind", "status", "progress", "attempts", "created_at", "finished_at")
    readonly_fields = tuple(field.name for field in EvaluationJob._meta.fields)


@admin.register(AnonymousProfile)
class AnonymousProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "consented_at", "created_at", "last_seen_at")
    exclude = ("credential_hash",)
    readonly_fields = ("id", "consented_at", "created_at", "last_seen_at")


admin.site.register(PersonalPolicy)
admin.site.register(RecommendationDecision)
admin.site.register(OutcomeEvent)
