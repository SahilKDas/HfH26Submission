import { task } from '@renderinc/sdk/workflows';

type AuditRequest = { cohortSize: number; seed: number };
type SyntheticCase = {
  id: string;
  intensity: number;
  capacity: 45 | 90 | 180;
  signals: number[];
  access: { noBreath: boolean; eyesOpen: boolean; silent: boolean; seated: boolean };
};
type Candidate = { id: string; score: number; excluded: string[] };
type CaseResult = { caseId: string; selected: string; margin: number; safe: boolean; reasons: string[] };

const PRACTICES = [
  { id: 'orient-five', base: 0.72, breath: false, standing: false, spoken: false },
  { id: 'pressure-anchor', base: 0.67, breath: false, standing: false, spoken: false },
  { id: 'longer-out', base: 0.71, breath: true, standing: false, spoken: false },
  { id: 'micro-movement', base: 0.64, breath: false, standing: true, spoken: false },
  { id: 'reduce-input', base: 0.7, breath: false, standing: false, spoken: false },
  { id: 'one-true-sentence', base: 0.61, breath: false, standing: false, spoken: true },
] as const;

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export const generateSyntheticCohort = task(
  { name: 'generate_synthetic_cohort', timeoutSeconds: 60 },
  function generateSyntheticCohort(request: AuditRequest): SyntheticCase[] {
    const count = Math.max(16, Math.min(200, Math.round(request.cohortSize)));
    const random = seeded(request.seed);
    return Array.from({ length: count }, (_, index) => ({
      id: `synthetic-${request.seed}-${index}`,
      intensity: 1 + Math.floor(random() * 10),
      capacity: ([45, 90, 180] as const)[Math.floor(random() * 3)] ?? 90,
      signals: Array.from({ length: 10 }, () => (random() > 0.72 ? 1 : 0)),
      access: {
        noBreath: random() > 0.5,
        eyesOpen: random() > 0.5,
        silent: random() > 0.5,
        seated: random() > 0.5,
      },
    }));
  },
);

export const evaluateCase = task(
  {
    name: 'evaluate_case',
    timeoutSeconds: 60,
    retry: { maxRetries: 2, waitDurationMs: 500, backoffScaling: 2 },
  },
  function evaluateCase(input: SyntheticCase): CaseResult {
    if (input.intensity < 1 || input.intensity > 10 || input.signals.length !== 10) {
      throw new Error('Synthetic input failed bounds validation');
    }
    const activation = input.signals.reduce((sum, value, index) => sum + value * (index + 1), 0) / 55;
    const candidates: Candidate[] = PRACTICES.map((practice, index) => {
      const excluded: string[] = [];
      if (input.access.noBreath && practice.breath) excluded.push('breath-sensitive');
      if (input.access.seated && practice.standing) excluded.push('seated-only');
      if (input.access.silent && practice.spoken) excluded.push('silent-only');
      if (input.intensity >= 8 && practice.id === 'one-true-sentence') excluded.push('high-intensity-reflection');
      const signalFit = input.signals[index % input.signals.length] ? 0.18 : 0;
      const durationFit = input.capacity >= 90 || practice.id === 'reduce-input' ? 0.08 : -0.05;
      return { id: practice.id, excluded, score: excluded.length ? -100 : practice.base + signalFit + durationFit + activation * 0.07 };
    }).sort((a, b) => b.score - a.score);
    const winner = candidates[0];
    const runnerUp = candidates[1];
    if (!winner || !runnerUp || winner.score < 0) throw new Error('No safe recommendation');
    return {
      caseId: input.id,
      selected: winner.id,
      margin: Number((winner.score - runnerUp.score).toFixed(4)),
      safe: winner.excluded.length === 0,
      reasons: ['bounded synthetic input', 'hard accessibility constraints', 'no demographic features'],
    };
  },
);

export const summarizeAudit = task(
  { name: 'summarize_audit', timeoutSeconds: 60 },
  function summarizeAudit(results: CaseResult[]) {
    const unsafe = results.filter((result) => !result.safe);
    const distribution = results.reduce<Record<string, number>>((counts, result) => {
      counts[result.selected] = (counts[result.selected] || 0) + 1;
      return counts;
    }, {});
    const averageMargin = results.reduce((sum, result) => sum + result.margin, 0) / Math.max(results.length, 1);
    return {
      modelCardVersion: 'unspool-local-ranker-1.0',
      generatedAt: new Date().toISOString(),
      syntheticCases: results.length,
      unsafeSelections: unsafe.length,
      pass: unsafe.length === 0 && Object.keys(distribution).length >= 2,
      averageDecisionMargin: Number(averageMargin.toFixed(4)),
      selectionDistribution: distribution,
      protectedAttributesUsed: [],
      rawHealthDataUsed: false,
      limitations: ['Synthetic parity checks do not establish clinical efficacy.', 'The recommender supports self-regulation and does not diagnose or treat.'],
    };
  },
);

task(
  {
    name: 'run_model_card_audit',
    timeoutSeconds: 600,
    plan: 'starter',
    retry: { maxRetries: 2, waitDurationMs: 1000, backoffScaling: 2 },
  },
  async function runModelCardAudit(request: AuditRequest) {
    const cohort = await generateSyntheticCohort(request);
    const results = await Promise.all(cohort.map((input) => evaluateCase(input)));
    return summarizeAudit(results);
  },
);
