from django.contrib import admin
from django.urls import include, path, re_path

from unspool_backend.views import api_not_found, health, spa

urlpatterns = [
    path("admin/", admin.site.urls),
    path("healthz", health),
    path("api/v1/", include("core.urls")),
    re_path(r"^api/(?P<path>.*)$", api_not_found),
    re_path(r"^(?P<path>.*)$", spa),
]
