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
- Minimized before/after intensity
- Timestamp and random local session ID

No text, identity, diagnosis, demographic attribute, contact, or location is stored.

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
| Re-identification | No identity or demographics; randomized local IDs | A compromised device can observe local activity |
| Unsafe recommendation | Crisis bypass, intensity constraints, access exclusions, cautions, tests | No automated system can infer all personal contraindications |
| Bias hidden by aggregate scores | Synthetic access-parity matrix and selection distribution | Synthetic audits do not represent lived experience or clinical efficacy |
| Secret exposure | Render key is server-only; CSP; `.env` ignored; payload size limit | Operational key rotation remains a deployment responsibility |
| Retention without control | One-action local erase; 30-session cap | Browser backups may persist according to OS/browser policy |

## Deployment boundary

This hackathon build is pre-clinical. It must not be deployed as a substitute for professional care. Before broader use: clinician content review, participatory safety research, penetration testing, accessibility audit, jurisdiction-specific crisis routing, privacy counsel, and a prospective outcomes study are required.

