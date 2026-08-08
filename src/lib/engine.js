import { interventions } from '../data/interventions.js';

const VECTOR_SIZE = 32;

function hashTerm(term) {
  let hash = 2166136261;
  for (let i = 0; i < term.length; i += 1) {
    hash ^= term.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function embedTerms(terms) {
  const vector = Array(VECTOR_SIZE).fill(0);
  terms.forEach((term) => {
    const normalized = term.toLowerCase().trim();
    const index = hashTerm(normalized) % VECTOR_SIZE;
    const sign = hashTerm(`${normalized}:sign`) % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  });
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0)) || 1;
  return vector.map((value) => value / magnitude);
}

function cosine(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

export function safetyGate(input) {
  if (input.immediateDanger) {
    return {
      blocked: true,
      level: 'urgent',
      reason: 'You said you may not be able to stay safe.',
    };
  }
  if (!input.signals?.length) {
    return { blocked: true, level: 'input', reason: 'Choose at least one signal so the recommendation has context.' };
  }
  return { blocked: false, level: input.intensity >= 9 ? 'high' : 'standard' };
}

function preferenceScore(item, preferences) {
  let score = 0;
  if (preferences.noBreath && item.id === 'longer-out') score -= 10;
  if (preferences.eyesOpen && item.modes.includes('eyes-open')) score += 0.7;
  if (preferences.silent && item.modes.includes('silent')) score += 0.55;
  if (preferences.seated && item.modes.includes('seated')) score += 0.45;
  return score;
}

function banditScore(id, outcomes = {}) {
  const record = outcomes[id] || { helpful: 0, tried: 0 };
  const total = Object.values(outcomes).reduce((sum, value) => sum + (value.tried || 0), 0);
  if (!record.tried) return { value: 0.32, label: 'new option' };
  const mean = record.helpful / record.tried;
  const exploration = Math.min(0.35, Math.sqrt((2 * Math.log(total + 2)) / record.tried) * 0.12);
  return { value: mean * 0.7 + exploration, label: `${Math.round(mean * 100)}% helpful before` };
}

export function rankInterventions(input, outcomes = {}) {
  const gate = safetyGate(input);
  if (gate.blocked) return { gate, ranked: [] };

  const queryVector = embedTerms([...input.signals, input.need, gate.level]);
  const ranked = interventions.map((item) => {
    const matchedSignals = item.signals.filter((signal) => input.signals.includes(signal));
    const signalScore = matchedSignals.length * 1.55;
    const needScore = item.needs.includes(input.need) ? 1.8 : 0;
    const durationScore = item.duration <= input.capacity ? 0.9 : -1.4;
    const rangeScore = input.intensity >= item.intensityRange[0] && input.intensity <= item.intensityRange[1] ? 0.7 : -0.5;
    const semanticScore = Math.max(0, cosine(queryVector, embedTerms([...item.signals, ...item.needs, item.evidence]))) * 1.25;
    const preference = preferenceScore(item, input.preferences || {});
    const bandit = banditScore(item.id, outcomes);
    const highIntensityPenalty = input.intensity >= 8 && item.id === 'one-true-sentence' ? -2.4 : 0;
    const score = signalScore + needScore + durationScore + rangeScore + semanticScore + preference + bandit.value + highIntensityPenalty;

    return {
      ...item,
      score,
      confidence: Math.max(64, Math.min(96, Math.round(68 + score * 3.1))),
      explanation: {
        matchedSignals,
        needMatched: needScore > 0,
        capacityFit: durationScore > 0,
        preferenceFit: preference > 0,
        learning: bandit.label,
        evidence: item.evidence,
      },
    };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  return { gate, ranked };
}

export function createPlan(input, outcomes = {}) {
  const result = rankInterventions(input, outcomes);
  if (result.gate.blocked) return result;
  const [primary, ...rest] = result.ranked;
  return {
    gate: result.gate,
    primary,
    alternatives: rest.slice(0, 2),
    audit: {
      dataUsed: ['selected body signals', 'intensity', 'available time', 'access preferences', 'local helpfulness history'],
      dataNotUsed: ['name', 'diagnosis', 'messages', 'location', 'demographics'],
      pipeline: ['safety gate', 'hybrid retrieval', 'contextual re-ranking', 'constraint check', 'explanation'],
      processed: 'on this device',
    },
  };
}

export function recordOutcome(outcomes, id, helpful) {
  const current = outcomes[id] || { helpful: 0, tried: 0 };
  return {
    ...outcomes,
    [id]: {
      helpful: current.helpful + (helpful ? 1 : 0),
      tried: current.tried + 1,
    },
  };
}

export function auditPreferenceParity(baseInput) {
  const variants = [
    { noBreath: true, eyesOpen: true, silent: true, seated: true },
    { noBreath: false, eyesOpen: false, silent: false, seated: false },
    { noBreath: true, eyesOpen: false, silent: true, seated: false },
  ];
  return variants.map((preferences) => {
    const result = rankInterventions({ ...baseInput, preferences });
    return { preferences, safe: !result.gate.blocked, top: result.ranked[0]?.id, score: result.ranked[0]?.score || 0 };
  });
}
