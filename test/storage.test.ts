import { describe, expect, it } from 'vitest';
import { addSession, clearPrivateData, loadOutcomes, loadSessions, recordOutcome } from '$lib/storage';

describe('local-only v2 records', () => {
  it('migrates v1 outcome counts and initializes harder safely', () => {
    localStorage.setItem('unspool:model-outcomes:v1', JSON.stringify({ 'reduce-input': { helpful: 2, tried: 3 } }));
    expect(loadOutcomes()).toEqual({ 'reduce-input': { helpful: 2, tried: 3, harder: 0 } });
  });

  it('discards legacy inferred after scores instead of presenting them as explicit', () => {
    localStorage.setItem('unspool:sessions:v1', JSON.stringify([{ id: 'old', createdAt: '2026-01-01T00:00:00.000Z', interventionId: 'reduce-input', before: 8, after: 6, helpful: true }]));
    expect(loadSessions()[0]).toMatchObject({ id: 'old', before: 8, after: null, outcome: null, completed: false });
  });

  it('stores only explicit measurements and outcomes', () => {
    const stored = addSession({ interventionId: 'orient-five', before: 8, after: 5, outcome: 'helped', completed: true });
    expect(stored).toMatchObject({ interventionId: 'orient-five', before: 8, after: 5, outcome: 'helped', completed: true });
    expect(stored).not.toHaveProperty('helpful');
  });

  it('counts helped, same, and harder with the documented semantics', () => {
    expect(recordOutcome('reduce-input', 'helped')['reduce-input']).toEqual({ helpful: 1, tried: 1, harder: 0 });
    expect(recordOutcome('reduce-input', 'same')['reduce-input']).toEqual({ helpful: 1, tried: 2, harder: 0 });
    expect(recordOutcome('reduce-input', 'harder')['reduce-input']).toEqual({ helpful: 1, tried: 3, harder: 1 });
  });

  it('erases both storage versions and resets harder exclusions', () => {
    localStorage.setItem('unspool:model-outcomes:v1', '{}');
    localStorage.setItem('unspool:sessions:v1', '[]');
    recordOutcome('reduce-input', 'harder');
    clearPrivateData();
    expect(loadOutcomes()).toEqual({});
    expect(loadSessions()).toEqual([]);
  });
});
