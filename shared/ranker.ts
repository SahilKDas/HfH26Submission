import { CAPACITY_OPTIONS, MODEL_SPEC, MODEL_VERSION, NEED_IDS, SIGNAL_IDS, type Capacity, type NeedId, type PracticeSpec, type Preferences, type SignalId } from './model.js';

const VECTOR_SIZE = 32;
export interface CheckInInput { signals: SignalId[]; need: NeedId; intensity: number; capacity: Capacity; preferences: Preferences; immediateDanger?: boolean; }
export interface OutcomeRecord { helpful: number; tried: number; harder: number; }
export type Outcomes = Record<string, OutcomeRecord>;
export interface Gate { blocked: boolean; level: string; reason?: string; }
export interface ScoreComponents { signal: number; need: number; duration: number; intensity: number; semantic: number; learning: number; }
export interface RankedPractice extends PracticeSpec {
  score: number; eligible: boolean; exclusions: string[]; confidence: number;
  explanation: { matchedSignals: SignalId[]; needMatched: boolean; capacityFit: boolean; preferenceFit: boolean; learning: string; evidence: string; components: ScoreComponents };
}
export interface RankResult { modelVersion: typeof MODEL_VERSION; gate: Gate; ranked: RankedPractice[]; candidates: RankedPractice[]; }

function hashTerm(term: string): number {
  let hash = 2166136261;
  for (let index = 0; index < term.length; index += 1) { hash ^= term.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return Math.abs(hash);
}
export function embedTerms(terms: readonly string[]): number[] {
  const vector = Array<number>(VECTOR_SIZE).fill(0);
  for (const term of terms) {
    const normalized = String(term).toLowerCase().trim();
    const index = hashTerm(normalized) % VECTOR_SIZE;
    const sign = hashTerm(`${normalized}:sign`) % 2 === 0 ? 1 : -1;
    vector[index] = (vector[index] ?? 0) + sign;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
function cosine(left: readonly number[], right: readonly number[]): number { return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0); }

export function safetyGate(input: Partial<CheckInInput>): Gate {
  if (input.immediateDanger) return { blocked: true, level: 'urgent', reason: 'You said you may not be able to stay safe.' };
  if (!Array.isArray(input.signals) || input.signals.length === 0) return { blocked: true, level: 'input', reason: 'Choose at least one signal so the recommendation has context.' };
  const bounded = input.signals.every((signal) => SIGNAL_IDS.includes(signal))
    && NEED_IDS.includes(input.need as NeedId)
    && Number.isInteger(input.intensity) && Number(input.intensity) >= 1 && Number(input.intensity) <= 10
    && CAPACITY_OPTIONS.includes(input.capacity as Capacity);
  if (!bounded) return { blocked: true, level: 'input', reason: 'The check-in contained an unsupported or out-of-range value.' };
  return { blocked: false, level: Number(input.intensity) >= 9 ? 'high' : 'standard' };
}

function outcomeScore(id: string, outcomes: Outcomes): { value: number; label: string; excluded: boolean } {
  const record = outcomes[id] ?? { helpful: 0, tried: 0, harder: 0 };
  const total = Object.values(outcomes).reduce((sum, value) => sum + (Number(value.tried) || 0), 0);
  if (record.harder > 0) return { value: 0, label: 'excluded after making things harder', excluded: true };
  if (!record.tried) return { value: 0.32, label: 'new option', excluded: false };
  const mean = record.helpful / record.tried;
  const exploration = Math.min(0.35, Math.sqrt((2 * Math.log(total + 2)) / record.tried) * 0.12);
  return { value: mean * 0.7 + exploration, label: `${Math.round(mean * 100)}% helpful before`, excluded: false };
}

export function getExclusionReasons(practice: PracticeSpec, input: CheckInInput, outcomes: Outcomes = {}): string[] {
  const reasons: string[] = [];
  if (practice.duration > input.capacity) reasons.push('needs more time than available');
  if (input.preferences.noBreath && practice.constraints.includes('breath-focused')) reasons.push('breath-focused');
  if (input.preferences.eyesOpen && !practice.modes.includes('eyes-open')) reasons.push('does not support eyes-open use');
  if (input.preferences.silent && !practice.modes.includes('silent')) reasons.push('does not support silent use');
  if (input.preferences.seated && !practice.modes.includes('seated')) reasons.push('does not support seated use');
  if (input.intensity >= 8 && practice.constraints.includes('low-intensity-reflection')) reasons.push('reflection excluded at high intensity');
  if ((outcomes[practice.id]?.harder ?? 0) > 0) reasons.push('locally excluded after harder feedback');
  return reasons;
}

export function rankModel(input: CheckInInput, outcomes: Outcomes = {}, practices: readonly PracticeSpec[] = MODEL_SPEC): RankResult {
  const gate = safetyGate(input);
  if (gate.blocked) return { modelVersion: MODEL_VERSION, gate, ranked: [], candidates: [] };
  const queryVector = embedTerms([...input.signals, input.need, gate.level]);
  const candidates: RankedPractice[] = practices.map((practice) => {
    const matchedSignals = practice.signals.filter((signal) => input.signals.includes(signal));
    const signal = matchedSignals.length * 1.55;
    const need = practice.needs.includes(input.need) ? 1.8 : 0;
    const duration = practice.duration <= input.capacity ? 0.9 : 0;
    const intensity = input.intensity >= practice.intensityRange[0] && input.intensity <= practice.intensityRange[1] ? 0.7 : -0.5;
    const semantic = Math.max(0, cosine(queryVector, embedTerms([...practice.signals, ...practice.needs, practice.evidence]))) * 1.25;
    const learning = outcomeScore(practice.id, outcomes);
    const exclusions = getExclusionReasons(practice, input, outcomes);
    const score = signal + need + duration + intensity + semantic + learning.value;
    const enabledPreferences = Object.values(input.preferences).filter(Boolean).length;
    const accessReasons = ['breath-focused', 'does not support eyes-open use', 'does not support silent use', 'does not support seated use'];
    return {
      ...practice, score: Number(score.toFixed(6)), eligible: exclusions.length === 0, exclusions,
      confidence: Math.max(64, Math.min(96, Math.round(68 + score * 3.1))),
      explanation: {
        matchedSignals: [...matchedSignals], needMatched: need > 0, capacityFit: duration > 0,
        preferenceFit: enabledPreferences > 0 && exclusions.every((reason) => !accessReasons.includes(reason)),
        learning: learning.label, evidence: practice.evidence,
        components: { signal: Number(signal.toFixed(4)), need: Number(need.toFixed(4)), duration: Number(duration.toFixed(4)), intensity: Number(intensity.toFixed(4)), semantic: Number(semantic.toFixed(4)), learning: Number(learning.value.toFixed(4)) },
      },
    };
  });
  const ranked = candidates.filter((candidate) => candidate.eligible).sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
  if (!ranked.length) return { modelVersion: MODEL_VERSION, gate: { blocked: true, level: 'options', reason: 'No practice fits every current access and time constraint. Change one setting or erase harder feedback to start fresh.' }, ranked: [], candidates };
  return { modelVersion: MODEL_VERSION, gate, ranked, candidates };
}
