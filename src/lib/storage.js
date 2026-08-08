const OUTCOME_KEY = 'unspool:model-outcomes:v2';
const SESSION_KEY = 'unspool:sessions:v2';
const LEGACY_OUTCOME_KEY = 'unspool:model-outcomes:v1';
const LEGACY_SESSION_KEY = 'unspool:sessions:v1';
export const AUDIO_SETTINGS_KEY = 'unspool:audio-settings:v1';

function parse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadOutcomes() {
  const current = parse(localStorage.getItem(OUTCOME_KEY), null);
  if (current) return normalizeOutcomes(current);

  const legacy = parse(localStorage.getItem(LEGACY_OUTCOME_KEY), {});
  const migrated = normalizeOutcomes(legacy);
  if (Object.keys(migrated).length) localStorage.setItem(OUTCOME_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveOutcomes(outcomes) {
  localStorage.setItem(OUTCOME_KEY, JSON.stringify(outcomes));
}

export function loadSessions() {
  const current = parse(localStorage.getItem(SESSION_KEY), null);
  if (current) return current.map(normalizeSession);

  const legacy = parse(localStorage.getItem(LEGACY_SESSION_KEY), []);
  const migrated = legacy.map((session) => normalizeSession({
    ...session,
    after: null,
    outcome: null,
    completed: false,
  }));
  if (migrated.length) localStorage.setItem(SESSION_KEY, JSON.stringify(migrated));
  return migrated;
}

export function addSession(session) {
  const sessions = loadSessions();
  const minimized = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    interventionId: session.interventionId,
    before: session.before,
    after: session.after ?? null,
    outcome: session.outcome ?? null,
    completed: session.completed === true,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify([minimized, ...sessions].slice(0, 30)));
  return minimized;
}

export function clearPrivateData() {
  localStorage.removeItem(OUTCOME_KEY);
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_OUTCOME_KEY);
  localStorage.removeItem(LEGACY_SESSION_KEY);
}

function normalizeOutcomes(outcomes) {
  return Object.fromEntries(Object.entries(outcomes || {}).map(([id, value]) => [id, {
    helpful: Number(value?.helpful) || 0,
    tried: Number(value?.tried) || 0,
    harder: Number(value?.harder) || 0,
  }]));
}

function normalizeSession(session) {
  const validOutcome = ['helped', 'same', 'harder'].includes(session?.outcome) ? session.outcome : null;
  return {
    id: session?.id || crypto.randomUUID(),
    createdAt: session?.createdAt || new Date().toISOString(),
    interventionId: session?.interventionId,
    before: Number.isFinite(session?.before) ? session.before : null,
    after: Number.isFinite(session?.after) ? session.after : null,
    outcome: validOutcome,
    completed: session?.completed === true,
  };
}
