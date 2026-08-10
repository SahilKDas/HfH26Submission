from __future__ import annotations

import json
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpRequest, HttpResponse, JsonResponse
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import ensure_csrf_cookie


@never_cache
def health(_: HttpRequest) -> JsonResponse:
    return JsonResponse({
        "status": "ok",
        "runtime": "django6-python3.13",
        "database": "postgresql" if "postgresql" in settings.DATABASES["default"]["ENGINE"] else "sqlite-test-only",
        "adaptiveModel": "unspool-adaptive-v3",
    })


@ensure_csrf_cookie
def spa(request: HttpRequest, path: str = "") -> HttpResponse:
    root = Path(settings.FRONTEND_BUILD)
    candidate = (root / path).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as error:
        raise Http404 from error
    if path and candidate.is_file():
        return FileResponse(candidate.open("rb"))
    index = root / "index.html"
    if not index.is_file():
        return JsonResponse({"detail": "Frontend build is unavailable. Run bun run build."}, status=503)
    return HttpResponse(index.read_text(encoding="utf-8"), content_type="text/html; charset=utf-8")


def api_not_found(_: HttpRequest, path: str = "") -> JsonResponse:
    return JsonResponse({"error": {"detail": "API endpoint not found."}}, status=404)
