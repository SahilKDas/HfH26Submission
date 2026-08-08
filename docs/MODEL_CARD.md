# Unspool local ranker - model card

Version: 1.0  
Status: Hackathon / pre-clinical  
Owner: Unspool project

## Intended use

Select one brief, non-diagnostic self-regulation practice from a curated library based on bounded body signals, immediate need, intensity, time, access preferences, and explicit local outcomes.

## Out-of-scope use

- Diagnosis, prognosis, treatment, medication, or clinical triage
- Crisis counseling or assessment
- Use on behalf of another person without their participation
- Inferring protected, demographic, or clinical attributes
- Replacing a clinician, emergency service, or trusted human

## System composition

- Deterministic safety gate
- Feature-hashed term embedding (32 dimensions)
- Structured metadata overlap
- Hard access and intensity constraints
- UCB-style local bandit
- Plain-language explanation object
- Synthetic distributed access-parity audit on Render Workflows

## Training data

No externally trained model is used and no user dataset is collected. Feature hashing is deterministic. Adaptation uses only per-practice helpful, tried, and harder counts stored locally. A practice marked harder is excluded until the user erases the private model.

## Inputs excluded by design

Name, email, phone, free text, diagnosis, medications, exact age, race, ethnicity, gender, sexuality, disability status, precise location, contacts, and browsing history.

## Evaluation

Automated checks cover:

- Immediate-danger bypass
- Empty-input rejection
- Explanation presence
- Breath-sensitive exclusion
- Local-learning update
- Safe candidate availability across access-preference variants
- Type safety of the distributed Workflow

The Render Workflow also reports unsafe selections, decision margins, selection distribution, protected attributes used, and whether raw health data was used.

## Known limitations

- Metadata retrieval is not clinical judgment.
- Feature-hashed similarity is intentionally compact and can collide.
- One-bit feedback can reflect context rather than intervention quality.
- No demographic inputs means the model cannot measure demographic outcome parity in production; this is an intentional privacy tradeoff and must be supplemented with consented, participatory research.
- Synthetic access audits cannot establish clinical safety or efficacy.
- The practice library is English-first and culturally incomplete.
- Crisis resources currently foreground the U.S./Canada 988 route and a global directory; production routing must be jurisdiction-aware.

## Human control

Users can inspect recommendation reasons, use or exit a low-stimulation guide, stop or reset any timer, restart with their selections preserved, skip breath-focused work, keep eyes open, require silence or a seated option, avoid crisis AI routing, skip outcome storage, and erase all local learning.
