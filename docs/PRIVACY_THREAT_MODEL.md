# Data and threat model

Privacy is a system constraint, not Unspool’s primary product claim. The primary system is an adaptive support loop; this document describes how its backend limits avoidable risk.

## Data flows

### Unconsented recommendation

The browser sends only bounded signals, need, intensity, time, access flags, and immediate-danger state to Django. The request is validated and processed in memory. No decision, body, IP address, or user-agent is written to application storage.

### Consented adaptive recommendation

Opt-in creates an anonymous profile with a random HttpOnly cookie. PostgreSQL stores the credential hash, bounded context, selected practice, model version, decision trace, and expiration. Explicit feedback adds outcome, optional after-intensity, completion, and elapsed time.

### Offline fallback

When Django is unavailable, deterministic-v2 runs locally. The interface labels the policy source. Offline feedback remains local and is never backfilled as an unverifiable training event.

### Model Room

The public simulation uses deterministic generated contexts and synthetic rewards. Jobs and aggregate reports are stored, but generated events are never inserted into profile, decision, or outcome tables and generated challengers cannot be promoted.

### Lofi radio

No request reaches Lofi Cafe before Play. The provider receives ordinary network metadata from direct audio playback but receives no application payload, profile credential, check-in, decision, or outcome.

## Retention and control

- Raw decisions and outcome events expire after 30 days.
- Personal response counts and matrices persist with the anonymous profile until reset.
- Reset deletes the profile, policy, decisions, and events through database cascades and clears the cookie.
- Production logs must omit request bodies, cookies, IP addresses, and user-agent values.
- Backups must follow the same maximum retention window before real deployment.

## Controls

| Threat | Control | Residual limitation |
|---|---|---|
| Forged outcome updates | Random HttpOnly credential, same-origin CSRF, decision ownership, one-to-one outcome, UUID idempotency | A compromised browser origin can act as the user |
| Model poisoning | Bounded schema, one outcome per issued decision, throttling, minimum event threshold, immutable snapshots, manual promotion | Coordinated valid-looking feedback remains possible |
| Learned score bypasses safety | Eligibility computed before ML; excluded arms never enter adaptive ranking | The best eligible choice can still be unhelpful |
| Sensitive log leakage | No body/cookie logging in application; generic client errors; private internal job errors | Infrastructure defaults require deployment review |
| Profile correlation | No account; random credential; no IP/UA retention; 30-day raw retention | Repeated bounded contexts remain sensitive health-adjacent data |
| CSRF | SameSite cookie, Django CSRF token, same-origin API | XSS would bypass browser-origin controls |
| XSS and third-party exfiltration | Hashed-script CSP, no third-party scripts/iframes, restricted media origin | Style inline remains allowed for generated progress styles |
| Worker duplication | PostgreSQL transaction with `select_for_update(skip_locked=True)` | SQLite test mode cannot prove PostgreSQL locking semantics |
| Unsafe model promotion | 3,072-case audit, coverage gate, immutable candidate, manual admin action | Synthetic gates do not establish clinical validity |
| Crisis misrouting | Immediate danger bypasses ML and exposes 988 plus international directory | Locale-specific routing remains incomplete |

## Deployment requirements

Before accepting real users: TLS, rotated Django secret, Secure cookies, restricted admin network/access, managed PostgreSQL encryption and backups, structured log redaction, dependency scanning, rate limits shared across web workers, penetration testing, privacy notice review, and deletion/backups verification.
