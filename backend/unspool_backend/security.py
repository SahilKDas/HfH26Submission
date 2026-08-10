from __future__ import annotations

import base64
import hashlib
import re
from pathlib import Path

from django.conf import settings
from django.http import HttpRequest, HttpResponse

SCRIPT_PATTERN = re.compile(r"<script>(.*?)</script>", re.DOTALL | re.IGNORECASE)


def inline_script_hash(html: str) -> str:
    match = SCRIPT_PATTERN.search(html)
    if not match:
        raise ValueError("Static index has no inline bootstrap script")
    digest = hashlib.sha256(match.group(1).encode("utf-8")).digest()
    return f"'sha256-{base64.b64encode(digest).decode('ascii')}'"


def content_security_policy(html: str) -> str:
    return (
        "default-src 'self'; script-src 'self' " + inline_script_hash(html)
        + "; img-src 'self' data:; media-src 'self' https://radio.loficafe.net"
        + "; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'"
        + "; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'"
        + "; base-uri 'self'; form-action 'self'"
    )


class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        index = Path(settings.FRONTEND_BUILD) / "index.html"
        self.csp = content_security_policy(index.read_text(encoding="utf-8")) if index.is_file() else "default-src 'self'; frame-ancestors 'none'"

    def __call__(self, request: HttpRequest) -> HttpResponse:
        response = self.get_response(request)
        response["Content-Security-Policy"] = self.csp
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "no-referrer"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.path == "/healthz" or request.path.startswith("/api/"):
            response["Cache-Control"] = "no-store"
        elif request.path in {"/", "/index.html", "/service-worker.js", "/manifest.webmanifest"}:
            response["Cache-Control"] = "no-cache"
        return response
