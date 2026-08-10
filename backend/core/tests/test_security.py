from django.test import SimpleTestCase

from unspool_backend.security import content_security_policy, inline_script_hash


class SecurityHeaderTests(SimpleTestCase):
    def test_bootstrap_receives_exact_hash(self):
        html = "<html><script>console.log('bounded')</script></html>"
        digest = inline_script_hash(html)
        self.assertTrue(digest.startswith("'sha256-"))
        policy = content_security_policy(html)
        self.assertIn("script-src 'self' 'sha256-", policy)
        self.assertNotIn("script-src 'self' 'unsafe-inline'", policy)
        self.assertIn("media-src 'self' https://radio.loficafe.net", policy)

    def test_missing_bootstrap_fails_closed(self):
        with self.assertRaises(ValueError):
            inline_script_hash("<html></html>")
