from django.urls import path

from core import api

urlpatterns = [
    path("profile/consent", api.profile_consent),
    path("profile/insights", api.profile_insights),
    path("profile", api.profile_delete),
    path("recommendations", api.recommendations),
    path("decisions/<uuid:decision_id>/outcome", api.record_outcome),
    path("models/active", api.model_status),
    path("simulations", api.simulations),
    path("jobs/<uuid:job_id>", api.job_detail),
]
