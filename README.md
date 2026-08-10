# Unspool

**One safe step now. A better-fitting step next time.**

Unspool is a closed-loop adaptive support engine for moments when language and executive function disappear. A bounded body-first check-in becomes one guided practice. An optional explicit outcome updates a safety-constrained contextual bandit so the next eligible decision can fit better.

Unspool is pre-clinical decision support. It does not diagnose, treat, replace a clinician, or provide crisis response.

## What is technically different

- Svelte 5 and SvelteKit provide the accessible guided experience, PWA resilience, Constraint Lab, Response Map, and lofi companion.
- Bun 1.3.14 owns JavaScript dependency installation, development orchestration, test invocation, and the frontend build.
- Django 6 and Django REST Framework own live inference, anonymous consent, durable decisions, idempotent outcomes, personal policies, model snapshots, evaluation jobs, and admin-controlled promotion.
- PostgreSQL 17 is the runtime database and job queue. Workers claim jobs transactionally with `select_for_update(skip_locked=True)`; no Redis is required.
- NumPy powers a 25-feature LinUCB policy. Hard safety and accessibility exclusions run before learning and cannot be overridden by learned scores.
- The deterministic TypeScript `unspool-ranker-v2` remains a clearly labeled offline fallback.

The canonical eight-practice specification lives in [`shared/practices.json`](./shared/practices.json) and is consumed by both Python and TypeScript.

## Adaptive loop

1. Validate bounded signals, need, intensity, time, and access requirements.
2. Bypass recommendation entirely when immediate safety is uncertain.
3. Remove incompatible practices through hard exclusions.
4. Build an inspectable evidence-informed baseline score.
5. Re-rank eligible candidates with the active global and anonymous personal LinUCB policies.
6. Update only the selected arm from an explicit `helped`, `same`, or `harder` outcome.
7. Train global challengers only after 200 new consented outcomes.
8. Require zero safety violations plus manual Django-admin approval before promotion.

Optional after-intensity is charted exactly as reported and never converted into a training reward.

## Model Room

The Method page exposes the real backend lifecycle. A live job trains a disposable challenger using 12,288 seeded synthetic interactions and evaluates it on 3,072 held-out constraint scenarios. Jobs survive browser navigation and expose queued, running, completed, failed, retry, cache, and JSON-download states.

Simulation results are isolated from production and explicitly demonstrate engineering behavior—not clinical effectiveness.

## Local setup

Requirements: Bun 1.3.14, Python 3.13, and PostgreSQL 17.

```powershell
bun install
py -3.13 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Create a PostgreSQL database and set `DATABASE_URL` in your shell or environment manager. Then:

```powershell
bun run backend:migrate
bun run dev
```

`bun run dev` starts Vite at `http://localhost:5173`, Django at `http://localhost:8000`, and the PostgreSQL model worker. The Vite server proxies `/api` and `/healthz` to Django. Django can still be run independently with `python backend/manage.py runserver`.

For a containerized PostgreSQL/web/worker stack on a machine with Docker:

```bash
docker compose up --build
```

## Verification

```powershell
bun run check:svelte
bun run test
bun run backend:test
bun run build
bun run test:e2e
```

The local backend test script sets an explicit SQLite test-only flag for fast isolation. Production and CI acceptance use PostgreSQL; the health endpoint names the active database backend so SQLite cannot be presented as production proof.

Coverage includes hard exclusions, 25-feature encoding, adaptive learning, harder-feedback removal, 3,072-case safety evaluation, consent, hashed credentials, idempotency, deletion, migrations, CSP, guided timing, radio behavior, PWA fallback, keyboard access, Axe, and the live Model Room worker.

## Consent and retention

- Unconsented online inference is transient.
- Persistent learning is an unchecked, explicit opt-in.
- A random HttpOnly credential identifies an anonymous profile; only its hash is stored.
- Consented events contain bounded decision context, selected practice, model version, explicit outcome, optional after-intensity, completion, and elapsed time.
- Names, diagnoses, journal text, contacts, IP addresses, and user-agent strings are not retained.
- Raw decisions and outcomes expire after 30 days; profile reset deletes the anonymous profile, personal policy, decisions, and retained events immediately.
- The radio provider receives no request before Play and never receives model or check-in data.

## Main files

- [`backend/core/engine.py`](./backend/core/engine.py) — safety gate, baseline, features, adaptive policy, and personal updates
- [`backend/core/api.py`](./backend/core/api.py) — consent, inference, outcomes, insights, model status, and simulation contracts
- [`backend/core/jobs.py`](./backend/core/jobs.py) — durable worker, simulation, training, and evaluation
- [`backend/core/models.py`](./backend/core/models.py) — profiles, policies, decisions, outcomes, snapshots, and jobs
- [`src/lib/api.ts`](./src/lib/api.ts) — same-origin adaptive client and offline boundary
- [`src/lib/components/AuditConsole.svelte`](./src/lib/components/AuditConsole.svelte) — live Model Room
- [`shared/practices.json`](./shared/practices.json) — canonical practice specification

## License

GNU Lesser General Public License v2.1. See [`LICENSE`](./LICENSE).
