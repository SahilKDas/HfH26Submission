# Unspool

**A low-language bridge from overwhelm to one safe next step.**

Unspool is a privacy-first mental-health web app built for the moment when someone knows they are overwhelmed but cannot explain why. Instead of opening with a blank journal or chatbot, it begins with body signals, available capacity, and access needs. A bounded local recommender returns one short, evidence-informed practice and a ready-to-send sentence for reaching a trusted person.

This is a complete Hack for Humanity Summer 2026 submission targeting:

- Best Mental Health Tool
- Best Design
- Best Use of AI/ML
- Responsible AI
- Best Use of Render
- Best Innovation and Creativity

## Why this is different

Most wellness products assume language, attention, and executive function are available during distress. Unspool treats that assumption as the problem. The central interaction is deliberately low-language and subtractive:

1. Tap body signals rather than explain a story.
2. Set intensity, time, and immediate need.
3. Apply hard accessibility constraints.
4. Receive one step, not a content feed.
5. See why it was selected.
6. Optionally copy a bridge sentence to a trusted person.
7. Teach the private model with one outcome bit.

Unspool is not a diagnostic tool, treatment, therapist replacement, or crisis service.

## AI/ML architecture

The in-browser recommender is a transparent five-stage pipeline:

1. **Safety gate** - Immediate-danger signals bypass recommendation and open human crisis support. Missing or out-of-range inputs fail closed.
2. **Hybrid retrieval** - Structured overlap is combined with a compact feature-hashed embedding over signal, need, and evidence tags.
3. **Contextual ranking** - Time, intensity, and accessibility are hard constraints. A local UCB-style contextual bandit balances prior helpfulness and limited exploration.
4. **Verification** - High-intensity reflection and incompatible breath, movement, voice, and eye-state options are penalized or excluded.
5. **Explanation** - The UI exposes signal match, time fit, access fit, evidence family, confidence, and local learning state.

There is no generative health conclusion and no raw health text is sent to a public model API.

## Render Workflows

The repository contains a real TypeScript Render Workflow under [`workflow/`](./workflow). It is a synthetic safety-audit pipeline, not a decorative worker:

1. `generate_synthetic_cohort` creates bounded, non-person synthetic cases.
2. `evaluate_case` fans out access-parity checks across the cohort with retries.
3. `summarize_audit` produces a versioned model-card result.
4. `run_model_card_audit` orchestrates the distributed chain.

The web service triggers the Workflow through the official `@renderinc/sdk`. Only a seed and cohort size cross the boundary. Real check-ins never enter the Workflow.

Render currently does not support creating Workflow services from Blueprints, so [`render.yaml`](./render.yaml) intentionally defines the web service only. The Workflow is connected as a separate service using the supported setup below.

## Run locally

Requirements: Node.js 22+

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Production verification:

```bash
npm run check
```

This runs the recommender safety tests, TypeScript validation for the Workflow, and the Vite production build.

To exercise the production server:

```bash
npm run build
npm start
```

Open `http://localhost:4173`. Without a Render API key, the live audit control returns an explicit local-safe-mode response.

## Deploy on Render

### 1. Deploy the web service

Create a Blueprint from this repository. [`render.yaml`](./render.yaml) builds the Vite app and runs the hardened Node static server.

### 2. Create the Workflow service

In the Render Dashboard:

- Select **New > Workflow**.
- Name: `unspool-ai-audit`
- Language: Node
- Region: Oregon (the same region as the web service)
- Root directory: `workflow`
- Build command: `npm ci`
- Start command: `npm start`

After registration, confirm the task slug is `unspool-ai-audit/run_model_card_audit`.

### 3. Connect the web service

Set these server-side environment variables on `unspool-web`:

```text
RENDER_API_KEY=<Render API key>
RENDER_AUDIT_TASK_SLUG=unspool-ai-audit/run_model_card_audit
```

Never prefix the key with `VITE_`; it must remain server-side.

## Privacy and safety

- No account, name, diagnosis, contact, location, free text, or demographic data is requested.
- Raw check-in choices exist only in transient React state.
- Persistent local storage contains a practice ID and a yes/no helpfulness count, plus minimized before/after scores.
- The user can erase the entire local model in one action.
- Crisis signaling bypasses ranking and links directly to real-time human support.
- The app avoids certainty, medical instructions, and clinical efficacy claims.
- Synthetic Workflow audits explicitly report that parity tests do not establish clinical efficacy.

See [`docs/PRIVACY_THREAT_MODEL.md`](./docs/PRIVACY_THREAT_MODEL.md) and [`docs/MODEL_CARD.md`](./docs/MODEL_CARD.md).

## Evidence-informed content boundary

The short practices are adapted conservatively from public self-help guidance, then bounded with opt-outs and cautions. They are not represented as treatment:

- The World Health Organization's *Doing What Matters in Times of Stress* describes brief grounding, noticing, naming, and reconnecting with the environment: <https://www.who.int/publications/i/item/9789240003927>
- NHS guidance describes gentle breathing without forcing and allows seated or standing positions: <https://www.nhs.uk/mental-health/self-help/guides-tools-and-activities/breathing-exercises-for-stress/>
- VA guidance describes five-senses grounding as a coping option in trauma-related distress: <https://www.ptsd.va.gov/professional/treat/essentials/anniversary_reactions.asp>
- Affect-labeling research is mixed and context-dependent. That uncertainty is why reflection is only one optional candidate, is penalized at high intensity, and carries an opt-out: <https://pubmed.ncbi.nlm.nih.gov/36580454/> and <https://pubmed.ncbi.nlm.nih.gov/42311801/>
- The 988 Lifeline describes free, confidential, judgment-free crisis support in the United States: <https://988lifeline.org/get-help/what-to-expect/>
- Responsible-AI controls follow NIST AI RMF themes of safety, transparency, explainability, privacy enhancement, and harmful-bias management: <https://www.nist.gov/itl/ai-risk-management-framework>

Content should receive clinician review before real-world clinical deployment.

## Key files

- [`src/App.jsx`](./src/App.jsx) - complete product UI and flows
- [`src/lib/engine.js`](./src/lib/engine.js) - recommender, safety gate, local learning, explanations
- [`src/data/interventions.js`](./src/data/interventions.js) - bounded practice library and cautions
- [`workflow/src/tasks.ts`](./workflow/src/tasks.ts) - distributed synthetic model-card audit
- [`server.mjs`](./server.mjs) - production server and Workflow trigger
- [`test/engine.test.js`](./test/engine.test.js) - safety and access-parity tests
- [`docs/DEVPOST_SUBMISSION.md`](./docs/DEVPOST_SUBMISSION.md) - submission copy
- [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) - four-minute demo plan

## Original visual asset

The hero artwork in `public/assets/unspool-sanctuary.png` was created for this project with OpenAI's built-in image generation tool. Prompt direction: an abstract paper-and-frosted-glass sanctuary, a luminous path from visual tangling into a calm clearing, deep indigo with coral and ivory light, no people, text, logos, medical symbols, or therapy clichés.

## License

Unspool is distributed under the GNU Lesser General Public License v2.1. See [`LICENSE`](./LICENSE).
