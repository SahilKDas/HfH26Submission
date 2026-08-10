import hashlib

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle


class UnspoolRateThrottle(SimpleRateThrottle):
    scope = "unspool"

    def get_cache_key(self, request, view):
        credential = request.COOKIES.get(settings.PROFILE_COOKIE_NAME)
        identity = hashlib.sha256(credential.encode()).hexdigest()[:24] if credential else self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": identity}
