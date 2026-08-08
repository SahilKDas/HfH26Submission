import test from 'node:test';
import assert from 'node:assert/strict';
import { addSession, clearPrivateData, loadOutcomes, loadSessions } from '../src/lib/storage.js';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

test('v1 outcomes migrate with harder initialized safely', () => {
  global.localStorage = memoryStorage({
    'unspool:model-outcomes:v1': JSON.stringify({ 'reduce-input': { helpful: 2, tried: 3 } }),
  });
  assert.deepEqual(loadOutcomes(), { 'reduce-input': { helpful: 2, tried: 3, harder: 0 } });
});

test('legacy inferred after scores are discarded during migration', () => {
  global.localStorage = memoryStorage({
    'unspool:sessions:v1': JSON.stringify([{
      id: 'old', createdAt: '2026-01-01T00:00:00.000Z', interventionId: 'reduce-input', before: 8, after: 6, helpful: true,
    }]),
  });
  const [session] = loadSessions();
  assert.equal(session.after, null);
  assert.equal(session.outcome, null);
  assert.equal(session.completed, false);
});

test('new sessions store only explicit measurements and outcome state', () => {
  global.localStorage = memoryStorage();
  const stored = addSession({ interventionId: 'orient-five', before: 8, after: 5, outcome: 'helped', completed: true });
  assert.equal(stored.after, 5);
  assert.equal(stored.outcome, 'helped');
  assert.equal(stored.completed, true);
  assert.equal('helpful' in stored, false);
});

test('erasing the private model removes both storage versions', () => {
  global.localStorage = memoryStorage({
    'unspool:model-outcomes:v1': '{}',
    'unspool:model-outcomes:v2': '{}',
    'unspool:sessions:v1': '[]',
    'unspool:sessions:v2': '[]',
  });
  clearPrivateData();
  assert.equal(global.localStorage.values.size, 0);
});
