# Unspool

**A low-language bridge from overwhelm to one safe next step.**

Unspool is a local-first mental-health web app for moments when explaining a story is too much. A short check-in captures body signals, intensity, time, immediate need, and access settings. A deterministic and inspectable ranker returns one bounded practice plus an optional sentence for reaching a trusted person.

This Hack for Humanity Summer 2026 submission targets Best Mental Health Tool, Best Design, Best Use of AI/ML, Responsible AI, and Best Innovation and Creativity.

Unspool is not a diagnostic tool, treatment, therapist replacement, or crisis service.

## Stack

- **Svelte 5 + SvelteKit 2 + TypeScript** for the installable, static-first interface
- **C++23** for the provider-neutral production server, security headers, and static delivery
- **A shared deterministic TypeScript core** for recommendations, exclusions, explanations, and the local synthetic audit
- **Vitest + Playwright + Axe + CTest** for model, storage, browser, accessibility, and native security coverage

There is no React application, Node production server, cloud audit, hosted database, analytics SDK, or required hosting provider. Node is used only at build time and for developer tooling.

## Product behavior

1. Tap body signals instead of writing free text.
2. Choose intensity, time, need, and access requirements.
3. Hard constraints remove incompatible practices before scoring.
4. Receive one short step—not a feed or chatbot.
5. Inspect why it ranked and what was excluded.
6. Optionally use fullscreen guidance with visual and nonverbal cues.
7. Optionally report an explicit after-intensity and `helped`, `same`, or `harder` outcome.

An explicit `harder` response locally excludes that practice until the private model is erased. Skipped feedback stores no after score or inferred outcome.

## Exact AI/ML architecture

[`shared/model.ts`](./shared/model.ts) is the sole eight-practice model specification. [`shared/ranker.ts`](./shared/ranker.ts) contains the executable safety gate, hard exclusions, feature-hashed semantic signal, structured scoring, reversible local learning, and score decomposition. The application imports that core as `unspool-ranker-v2`; tests fail if presentation and model IDs diverge.

The judge-facing Constraint Lab changes bounded synthetic inputs and immediately exposes rankings, component scores, exclusions, and reasons. Lab inputs stay in memory and never become check-in records.

The local audit in [`shared/audit.ts`](./shared/audit.ts) generates 3,072 deterministic non-person scenarios and evaluates the exact same ranker entirely in the browser. The resulting versioned report covers safety violations, constraint violations, selection distribution, practice coverage, access coverage, and decision margins. It evaluates deterministic constraint behavior—not treatment efficacy, clinical validity, or demographic fairness.

## Run locally

Requirements:

- Node.js 22+
- CMake 3.24+
- A C++23 compiler and OpenSSL development libraries
- On Windows, MinGW-w64 (`g++`) available on `PATH`

Install and run the frontend development server:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Build and run the production stack:

```bash
npm run build
npm run backend:build
npm start
```

Open `http://localhost:4173`.

Run verification:

```bash
npm run check
npm run test:e2e
```

`npm run check` covers Svelte/TypeScript diagnostics, exact-ranker and migration tests, native C++ compilation/CTest, and the production build. Playwright then boots the real C++ server for full-flow, keyboard, Axe, 360px, reduced-motion, demo-isolation, local-audit, radio, CSP, and offline checks.

## Deployment

[`Dockerfile`](./Dockerfile) produces one small native service containing the prebuilt SvelteKit application. It has no provider-specific environment variables or integration. Deploy the image to any container host, VM, or local machine that can expose the `PORT` environment variable.

The app’s core experience also remains usable as a static site. The C++ service is retained for the C++23 implementation, health checking, deterministic cache policy, and hashed Content Security Policy.

## Privacy, safety, and offline boundaries

- No account, name, diagnosis, contact, location, journal text, or demographic data is requested.
- Raw check-in choices live only in client memory.
- Local storage contains practice IDs, explicit outcome counts, completion state, and optional user-entered before/after intensity.
- Legacy inferred after scores are discarded during v2 migration.
- Crisis signaling bypasses ranking and opens human support in one action.
- `?demo=1` keeps sessions and model updates in isolated memory.
- The service worker caches only application assets; never radio media, check-ins, sessions, or the private model.
- The local audit uses generated synthetic cases in memory and makes no network request.
- The optional Lofi Cafe stream receives no request before Play and never receives check-in or model data.

See [`docs/PRIVACY_THREAT_MODEL.md`](./docs/PRIVACY_THREAT_MODEL.md), [`docs/MODEL_CARD.md`](./docs/MODEL_CARD.md), and [`docs/ACCESSIBILITY_CHECKLIST.md`](./docs/ACCESSIBILITY_CHECKLIST.md).

## Evidence boundary

Every practice has an in-product ledger with intended use, evidence family, cautions, contraindication logic, primary or authoritative sources, last-reviewed date, and the label **literature-informed; not clinician reviewed**. These sources support the rationale family, not the efficacy of Unspool’s exact sequence. External clinical review is required before clinical deployment.

## Key files

- [`src/routes/+page.svelte`](./src/routes/+page.svelte) — application flow and in-memory check-in state
- [`src/lib/components/`](./src/lib/components/) — Svelte product surfaces
- [`src/lib/storage.ts`](./src/lib/storage.ts) — explicit v2 records and migrations
- [`shared/model.ts`](./shared/model.ts) — sole model specification
- [`shared/ranker.ts`](./shared/ranker.ts) — deterministic executable ranker
- [`shared/audit.ts`](./shared/audit.ts) — reproducible local corpus and report
- [`backend/src/main.cpp`](./backend/src/main.cpp) — provider-neutral C++23 web service
- [`backend/src/static_security.cpp`](./backend/src/static_security.cpp) — hashed CSP generation
- [`e2e/accessibility.spec.js`](./e2e/accessibility.spec.js) — end-to-end and accessibility proof
- [`docs/DEVPOST_SUBMISSION.md`](./docs/DEVPOST_SUBMISSION.md) — submission copy
- [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) — four-minute demo plan

## License

GNU Lesser General Public License v2.1. See [`LICENSE`](./LICENSE).
