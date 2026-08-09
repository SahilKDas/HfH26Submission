import { describe, expect, it } from 'vitest';
import { practices } from '$lib/data';
import { evaluateAuditCase, generateAuditCorpus, summarizeAuditResults } from '$shared/audit';
import { MODEL_SPEC, MODEL_VERSION, NEED_IDS, SIGNAL_IDS } from '$shared/model';
import { rankModel, safetyGate, type CheckInInput } from '$shared/ranker';

const fixture: CheckInInput = {
  signals: ['overstimulated', 'racing'], need: 'quiet', intensity: 8, capacity: 90,
  preferences: { noBreath: true, eyesOpen: true, silent: true, seated: true }, immediateDanger: false,
};

describe('shared exact ranker', () => {
  it('keeps all eight presentation and model IDs in exact parity', () => {
    expect(MODEL_SPEC).toHaveLength(8);
    expect(practices.map(({ id }) => id)).toEqual(MODEL_SPEC.map(({ id }) => id));
    expect(practices.every(({ steps, why }) => steps.length > 0 && Boolean(why))).toBe(true);
  });

  it('enforces danger, duration, access, and high-intensity constraints before ranking', () => {
    expect(safetyGate({ ...fixture, immediateDanger: true })).toMatchObject({ blocked: true, level: 'urgent' });
    const result = rankModel({ ...fixture, capacity: 45 });
    expect(result.modelVersion).toBe(MODEL_VERSION);
    expect(result.ranked.every(({ duration }) => duration <= 45)).toBe(true);
    expect(result.candidates.find(({ id }) => id === 'longer-out')?.exclusions).toEqual(expect.arrayContaining(['needs more time than available', 'breath-focused']));
    expect(result.candidates.find(({ id }) => id === 'one-true-sentence')?.exclusions).toContain('reflection excluded at high intensity');
  });

  it('fails closed for unsupported and out-of-range inputs', () => {
    expect(safetyGate({ ...fixture, intensity: 11 }).blocked).toBe(true);
    expect(safetyGate({ ...fixture, signals: [] }).blocked).toBe(true);
    expect(safetyGate({ ...fixture, capacity: 999 as CheckInInput['capacity'] }).blocked).toBe(true);
  });

  it('locally excludes a practice after explicit harder feedback', () => {
    const result = rankModel(fixture, { 'reduce-input': { helpful: 0, tried: 1, harder: 1 } });
    expect(result.ranked.some(({ id }) => id === 'reduce-input')).toBe(false);
    expect(result.candidates.find(({ id }) => id === 'reduce-input')?.exclusions).toContain('locally excluded after harder feedback');
  });
});

describe('fixed audit corpus', () => {
  it('is reproducible and covers every supported input dimension', () => {
    const first = generateAuditCorpus();
    expect(first).toHaveLength(3072);
    expect(first).toEqual(generateAuditCorpus());
    expect(new Set(first.flatMap(({ signals }) => signals))).toEqual(new Set(SIGNAL_IDS));
    expect(new Set(first.map(({ need }) => need))).toEqual(new Set(NEED_IDS));
    expect(new Set(first.map(({ intensity }) => intensity))).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
    for (const key of ['noBreath', 'eyesOpen', 'silent', 'seated'] as const) expect(new Set(first.map(({ preferences }) => preferences[key]))).toEqual(new Set([true, false]));
  });

  it('produces an honest bounded report with no constraint violations', () => {
    const report = summarizeAuditResults(generateAuditCorpus().map(evaluateAuditCase), { generatedAt: '2026-08-08T00:00:00.000Z' });
    expect(report).toMatchObject({ passed: true, scenarioCount: 3072, unsafeSelections: 0, constraintViolations: 0, protectedAttributesUsed: [] });
    expect(Object.values(report.practiceCoverage).every((count) => count > 0)).toBe(true);
    expect(report.limitations.join(' ')).toMatch(/does not establish clinical efficacy/i);
  });
});
