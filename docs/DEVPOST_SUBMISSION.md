# Devpost submission copy

## Project name

Unspool

## Tagline

One safe step now. A better-fitting step next time.

## Inspiration

The moment someone most needs support is often the moment they have the least language and executive function available. Most mental-health tools still begin with a blank journal page, a chatbot prompt, or a long library. Unspool begins below language: racing thoughts, a tight chest, numbness, shutdown, restlessness, or sensory overload are enough to start.

## What it does

Unspool is a closed-loop adaptive support engine for acute overwhelm. A ten-second bounded check-in captures body signals, intensity, available time, immediate need, and access requirements. It returns one brief evidence-informed practice—not a feed—and explains the decision.

After the practice, the user may explicitly choose `helped`, `same`, or `harder`. That response updates an anonymous personal contextual bandit so the next eligible decision can fit better. `Harder` excludes that practice from the personal policy. Optional after-intensity is charted exactly as reported and never inferred or silently converted into a reward.

Immediate danger bypasses recommendation and opens human crisis support in one action.

## How we built it

The Svelte 5/SvelteKit interface includes the body-first check-in, low-stimulation guided mode, Response Map, Constraint Lab, evidence ledger, installable offline shell, Web Audio cues, and an optional Lofi Cafe stream. Bun owns dependency installation, local process orchestration, test invocation, and the frontend build while leaving Python inference and PostgreSQL persistence to the backend.

Django 6 and Django REST Framework run the adaptive lifecycle. PostgreSQL stores anonymous consent, durable recommendation decisions, idempotent outcomes, personal policies, model snapshots, evaluation jobs, and promotion state. A separate worker claims jobs transactionally from PostgreSQL, so training never blocks a recommendation request and no Redis or provider-specific workflow product is required.

The decision pipeline has five stages:

1. Bounded validation and crisis bypass.
2. Hard time, intensity, breath, eye-state, sound, posture, and personal-harder exclusions.
3. An inspectable evidence prior combining structured matching and feature-hashed retrieval.
4. A 25-feature LinUCB policy combining active global and anonymous personal estimates.
5. A model lifecycle that trains challengers, evaluates safety and coverage, and requires manual approval before promotion.

When Django is unavailable, the app clearly labels and uses deterministic `unspool-ranker-v2`; offline feedback remains local and cannot become an unverifiable training event.

## Model Room

Judges can run the backend live. The Model Room queues a disposable challenger, trains it on 12,288 deterministic synthetic interactions, evaluates it on 3,072 held-out scenarios, and reports simulated reward, regret, coverage, uncertainty, decision margins, unsafe selections, and constraint violations. Identical completed runs are cached for ten minutes.

Synthetic jobs are permanently isolated from production. They demonstrate learning-system behavior, not clinical effectiveness.

## Challenges

The central engineering challenge was allowing learning without allowing learning to weaken safety. We made eligibility and ranking separate systems: the bandit can reorder only candidates that already passed every hard constraint. Tests intentionally assign enormous learned weights to excluded practices and verify that they remain impossible to select.

The second challenge was honest feedback. A stopped timer, lower number, or skipped form is not proof that a practice helped. Only the explicit outcome enum updates the bandit; after-intensity remains a separate measurement.

The third challenge was building a visible model lifecycle without external workflow infrastructure. PostgreSQL serves as both the durable application database and an atomic job queue, with retry, stale-job recovery, caching, and admin-gated promotion.

## Accomplishments

- A distinct low-language interaction that remains usable during overwhelm.
- A real online contextual bandit rather than a chatbot wrapper or hardcoded “AI” label.
- Hard exclusions that learned weights cannot override.
- Immediate personal adaptation plus evaluated, versioned global challengers.
- A live judge-facing training and evaluation pipeline.
- Anonymous opt-in profiles, idempotent feedback, 30-day retention, and one-action deletion.
- Accessible guided practice, crisis bypass, explicit offline fallback, and third-party audio isolation.
- Automated frontend, backend, model, PostgreSQL CI, PWA, Axe, keyboard, reduced-motion, and mobile coverage.

## What we learned

The strongest responsible-AI behavior is operational: responsibility should decide whether a model can ship. Unspool makes safety evaluation and manual promotion part of the backend lifecycle rather than relying on a disclaimer.

We also learned that personalization does not require pretending to be human. The useful intelligence here is choosing among bounded actions, learning from explicit response, and knowing which options are forbidden.

## What is next

Before clinical deployment, Unspool needs clinician review of every practice, participatory research with people who experience panic, shutdown, dissociation, sensory overload, and limited speech, external accessibility testing, jurisdiction-specific crisis routing, privacy counsel, adversarial model review, and a preregistered prospective outcomes study.

## Built with

Svelte 5, SvelteKit 2, TypeScript, Bun 1.3.14, Django 6, Django REST Framework, Python 3.13, PostgreSQL 17, NumPy, WhiteNoise, Gunicorn, Vitest, Playwright, Axe, Docker, and OpenAI image generation for the original hero artwork.

## Tracks

Best Mental Health Tool; Best Use of AI/ML; Responsible AI; Best Design; Best Innovation and Creativity.
