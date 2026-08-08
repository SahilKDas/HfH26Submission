import test from 'node:test';
import assert from 'node:assert/strict';
import { auditPreferenceParity, createPlan, rankInterventions, recordOutcome, safetyGate } from '../src/lib/engine.js';

const base = {
  signals: ['overstimulated', 'racing'],
  need: 'quiet',
  intensity: 8,
  capacity: 90,
  preferences: { noBreath: false, eyesOpen: true, silent: true, seated: true },
  immediateDanger: false,
};

test('urgent safety signal bypasses recommendation generation', () => {
  const result = createPlan({ ...base, immediateDanger: true });
  assert.equal(result.gate.blocked, true);
  assert.equal(result.gate.level, 'urgent');
  assert.equal(result.ranked.length, 0);
});

test('recommendations are evidence-backed and explainable', () => {
  const result = createPlan(base);
  assert.ok(result.primary);
  assert.ok(result.primary.explanation.evidence);
  assert.ok(result.audit.pipeline.includes('safety gate'));
  assert.ok(result.audit.dataNotUsed.includes('demographics'));
});

test('breath-sensitive preference excludes breathing exercise from the top rank', () => {
  const result = rankInterventions({
    ...base,
    signals: ['tight-chest', 'racing'],
    need: 'settle',
    preferences: { ...base.preferences, noBreath: true },
  });
  assert.notEqual(result.ranked[0].id, 'longer-out');
});

test('local feedback changes ranking without storing journal content', () => {
  let outcomes = {};
  outcomes = recordOutcome(outcomes, 'reduce-input', true);
  outcomes = recordOutcome(outcomes, 'reduce-input', true);
  assert.deepEqual(outcomes['reduce-input'], { helpful: 2, tried: 2 });
  const result = createPlan(base, outcomes);
  assert.match(result.primary.explanation.learning, /helpful before|new option/);
});

test('all accessibility preference variants receive a safe recommendation', () => {
  const audit = auditPreferenceParity(base);
  assert.equal(audit.length, 3);
  assert.ok(audit.every((variant) => variant.safe && variant.top));
});

test('empty check-ins fail input validation', () => {
  assert.equal(safetyGate({ ...base, signals: [] }).blocked, true);
});
