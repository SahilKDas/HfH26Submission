# Privacy and threat model

## Data inventory

### Transient only

- Selected body-signal IDs
- Chosen immediate need
- Intensity and available time
- Breath, eye-state, silence, and position preferences

These values exist in React state for the active check-in and are discarded when the flow closes or reloads.

### Optional local persistence

- Intervention ID
- Tried count
- Helpful count
- Harder/exclusion count
- Explicit helped/same/harder outcome
- Completion state
- Before intensity and optional user-reported after intensity
- Timestamp and random local session ID

No text, identity, diagnosis, demographic attribute, contact, or location is stored.

### Optional third-party radio request

The lofi stream is not loaded until the user presses Play. Playback connects directly to `radio.loficafe.net`, which can receive the listener's IP address, user agent, and ordinary request metadata. Unspool sends no check-in choices, local-model values, identity fields, or analytics with that request. Playback never resumes automatically after reload.

### Render Workflow input

- Fixed audit kind
- Synthetic cohort size
- Deterministic seed

The web endpoint rejects other audit kinds. It does not accept a user check-in vector.

## Threats and controls

| Threat | Control | Residual risk |
|---|---|---|
| Prompt injection | No free-text model input; bounded enums and numeric ranges | Malicious modification of client code requires separate web compromise |
| Health hallucination | No generative health output; curated static practice library | Practice wording still requires clinician review |
| Raw health-data leakage | In-browser processing; no analytics; no third-party model endpoint | Local browser storage is available to the browser profile and OS |
| Radio-provider disclosure | Explicit Play action, `preload="none"`, provider notice, isolated media CSP, no check-in data in the request | The stream provider necessarily receives normal network metadata such as IP address |
| Re-identification | No identity or demographics; randomized local IDs | A compromised device can observe local activity |
| Unsafe recommendation | Crisis bypass, intensity constraints, access exclusions, cautions, tests | No automated system can infer all personal contraindications |
| Bias hidden by aggregate scores | Synthetic access-parity matrix and selection distribution | Synthetic audits do not represent lived experience or clinical efficacy |
| Secret exposure | Render key is server-only; CSP; `.env` ignored; payload size limit | Operational key rotation remains a deployment responsibility |
| Retention without control | One-action local erase; 30-session cap | Browser backups may persist according to OS/browser policy |

## Deployment boundary

This hackathon build is pre-clinical. It must not be deployed as a substitute for professional care. Before broader use: clinician content review, participatory safety research, penetration testing, accessibility audit, jurisdiction-specific crisis routing, privacy counsel, and a prospective outcomes study are required.
