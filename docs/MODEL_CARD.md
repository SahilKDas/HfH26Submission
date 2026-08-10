# Unspool adaptive model card

## Identity

- Active family: `unspool-adaptive-v3`
- Offline fallback: `unspool-ranker-v2`
- Canonical content: `shared/practices.json`
- Feature count: 25
- Candidate arms: eight bounded, literature-informed practices
- Status: pre-clinical; not clinician reviewed

## Intended use

Unspool ranks one brief self-regulation option after a user explicitly selects bounded body signals, immediate need, intensity, available time, and access requirements. It is not intended to diagnose, treat, infer emotion, generate medical advice, or manage a crisis.

## Pipeline

1. Validate the bounded request and bypass recommendation for immediate-danger input.
2. Exclude practices that violate time, intensity, breath, eye-state, silence, posture, or personal-harder constraints.
3. Compute an evidence prior from structured overlap and a compact feature-hashed semantic score.
4. Encode a 25-feature context: bias, ten multi-hot signals, six one-hot needs, normalized intensity, three time capacities, and four access flags.
5. Use LinUCB estimates from the active global policy and anonymous personal policy to reorder eligible candidates.
6. Expose model version, margin, score components, expected reward, uncertainty, and exclusions.

Learned scores are downstream from eligibility and cannot restore an excluded candidate.

## Learning

- `helped` maps to reward `1`.
- `same` maps to reward `0`.
- `harder` maps to reward `-1` and immediately excludes the practice from that personal policy.
- Optional after-intensity is retained as an explicit measurement but is never inferred or used as a reward.
- Skipped feedback does not update policy matrices.
- Global challenger training requires at least 200 new consented explicit outcomes.

Personal matrices update transactionally when an idempotent outcome is accepted. Global challengers are immutable snapshots and require manual promotion.

## Evaluation and promotion

Every challenger is evaluated on 3,072 seeded constraint scenarios. Promotion requires:

- zero unsafe selections;
- zero hard-constraint violations;
- practice coverage across at least six of eight arms;
- deterministic feature and evaluation behavior;
- manual review through Django admin.

The public Model Room uses an isolated 12,288-interaction synthetic training environment followed by 3,072 held-out cases. Its challengers are disposable and structurally unable to become active production snapshots.

Synthetic reward, regret, and improvement metrics demonstrate the mechanics of online learning. They do not demonstrate clinical safety, effectiveness, fairness, or health outcomes.

## Data

Unconsented inference is transient. Opt-in learning stores bounded context, selected arm, model version, explicit outcome, optional after-intensity, completion, and elapsed time for 30 days. Anonymous profiles are authenticated by a random HttpOnly credential; only its salted application hash is stored.

The application does not retain names, email addresses, diagnoses, journal text, contacts, IP addresses, user-agent strings, location, audio, or demographics.

Profile deletion cascades through personal policy, retained decisions, and outcomes. Existing aggregate model parameters are not represented as reversible personal records; this limitation is disclosed before broader deployment.

## Known limitations

- The practice library and exact sequences have not received external clinical review.
- No prospective user study establishes effectiveness.
- Sparse personal outcomes produce high uncertainty and limited adaptation.
- Population learning may encode selection and response bias from opt-in users.
- No demographic collection means production demographic parity cannot be measured.
- Synthetic access coverage does not establish lived accessibility or clinical safety.
- A bounded contextual bandit is still a decision system and can make poor eligible choices.
- Crisis routing currently assumes US/Canada 988 plus an international helpline directory.

## Required work before clinical deployment

Clinician review, participatory research, external accessibility testing, jurisdiction-specific crisis routing, privacy and security review, consent comprehension testing, adversarial evaluation, demographic fairness research with appropriate consent, model-unlearning policy, and a preregistered prospective outcome study.
