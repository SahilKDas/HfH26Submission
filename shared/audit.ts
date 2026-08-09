import { ACCESS_KEYS, CAPACITY_OPTIONS, MODEL_SPEC, MODEL_VERSION, NEED_IDS, SIGNAL_IDS, type AccessKey, type Preferences } from './model.js';
import { rankModel, type CheckInInput } from './ranker.js';

export const AUDIT_SEED = 2026;
export const AUDIT_SCENARIO_COUNT = 3072;
export const AUDIT_SHARD_COUNT = 24;
export interface AuditScenario extends CheckInInput { id: string; }
export interface AuditCaseResult { caseId: string; selected: string | null; margin: number; safe: boolean; violations: string[]; access: Preferences; }
export interface AuditReport {
  schemaVersion: 1; modelVersion: typeof MODEL_VERSION; generatedAt: string; seed: number; scenarioCount: number; passed: boolean;
  unsafeSelections: number; constraintViolations: number; selectionDistribution: Record<string, number>; practiceCoverage: Record<string, number>;
  accessCoverage: Record<AccessKey, number>; decisionMargin: { minimum: number; mean: number; p05: number }; protectedAttributesUsed: []; limitations: string[];
}
function seeded(seed: number): () => number { let state = seed >>> 0; return () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 0x100000000; }; }
function shuffle<T>(items: readonly T[], seed: number): T[] { const random = seeded(seed); const copy = [...items]; for (let index = copy.length - 1; index > 0; index -= 1) { const target = Math.floor(random() * (index + 1)); [copy[index], copy[target]] = [copy[target] as T, copy[index] as T]; } return copy; }
export function generateAuditCorpus({ count = AUDIT_SCENARIO_COUNT, seed = AUDIT_SEED }: { count?: number; seed?: number } = {}): AuditScenario[] {
  const boundedCount = Math.max(96, Math.min(AUDIT_SCENARIO_COUNT, Math.round(count)));
  const cases = Array.from({ length: boundedCount }, (_, index): AuditScenario => {
    const accessMask = (index * 13 + seed) % 16;
    const primarySignal = SIGNAL_IDS[(index + seed) % SIGNAL_IDS.length] ?? 'racing';
    const secondarySignal = SIGNAL_IDS[(index * 7 + 3 + seed) % SIGNAL_IDS.length] ?? 'racing';
    return {
      id: `synthetic-${seed}-${String(index).padStart(4, '0')}`,
      signals: primarySignal === secondarySignal ? [primarySignal] : [primarySignal, secondarySignal],
      need: NEED_IDS[(Math.floor(index / SIGNAL_IDS.length) + seed) % NEED_IDS.length] ?? 'grounding',
      intensity: 1 + ((Math.floor(index / (SIGNAL_IDS.length * NEED_IDS.length)) + seed) % 10),
      capacity: CAPACITY_OPTIONS[(index * 7 + seed) % CAPACITY_OPTIONS.length] ?? 90,
      preferences: Object.fromEntries(ACCESS_KEYS.map((key, bit) => [key, Boolean(accessMask & (1 << bit))])) as Preferences,
      immediateDanger: false,
    };
  });
  return shuffle(cases, seed);
}
export function evaluateAuditCase(input: AuditScenario): AuditCaseResult {
  const result = rankModel(input); const winner = result.ranked[0]; const runnerUp = result.ranked[1]; const violations: string[] = [];
  if (!winner || result.gate.blocked) violations.push('no safe recommendation');
  if (winner) {
    if (winner.duration > input.capacity) violations.push('duration exceeds capacity');
    if (input.preferences.noBreath && winner.constraints.includes('breath-focused')) violations.push('breath constraint violated');
    if (input.preferences.eyesOpen && !winner.modes.includes('eyes-open')) violations.push('eyes-open constraint violated');
    if (input.preferences.silent && !winner.modes.includes('silent')) violations.push('silent constraint violated');
    if (input.preferences.seated && !winner.modes.includes('seated')) violations.push('seated constraint violated');
    if (input.intensity >= 8 && winner.constraints.includes('low-intensity-reflection')) violations.push('high-intensity reflection selected');
  }
  return { caseId: input.id, selected: winner?.id ?? null, margin: winner && runnerUp ? Number((winner.score - runnerUp.score).toFixed(6)) : 0, safe: Boolean(winner) && violations.length === 0, violations, access: input.preferences };
}
export function summarizeAuditResults(results: readonly AuditCaseResult[], { seed = AUDIT_SEED, generatedAt = new Date().toISOString() }: { seed?: number; generatedAt?: string } = {}): AuditReport {
  const distribution = Object.fromEntries(MODEL_SPEC.map((practice) => [practice.id, 0])) as Record<string, number>;
  const accessCoverage = Object.fromEntries(ACCESS_KEYS.map((key) => [key, 0])) as Record<AccessKey, number>;
  let unsafeSelections = 0; let constraintViolations = 0; const margins: number[] = [];
  for (const result of results) {
    if (!result.safe) unsafeSelections += 1; constraintViolations += result.violations.length;
    if (result.selected) distribution[result.selected] = (distribution[result.selected] ?? 0) + 1;
    for (const key of ACCESS_KEYS) if (result.access[key] && result.safe) accessCoverage[key] = (accessCoverage[key] ?? 0) + 1;
    margins.push(result.margin);
  }
  const sortedMargins = [...margins].sort((left, right) => left - right);
  const mean = margins.reduce((sum, value) => sum + value, 0) / Math.max(margins.length, 1);
  const p05 = sortedMargins[Math.floor(Math.max(0, sortedMargins.length - 1) * 0.05)] ?? 0;
  return {
    schemaVersion: 1, modelVersion: MODEL_VERSION, generatedAt, seed, scenarioCount: results.length,
    passed: unsafeSelections === 0 && constraintViolations === 0, unsafeSelections, constraintViolations,
    selectionDistribution: distribution, practiceCoverage: { ...distribution }, accessCoverage,
    decisionMargin: { minimum: Number((sortedMargins[0] ?? 0).toFixed(6)), mean: Number(mean.toFixed(6)), p05: Number(p05.toFixed(6)) },
    protectedAttributesUsed: [],
    limitations: ['Synthetic constraint evaluation does not establish clinical efficacy or clinical validity.', 'No demographic attributes are collected, so this report does not claim demographic fairness.', 'The recommender supports brief self-regulation and does not diagnose or treat.'],
  };
}
