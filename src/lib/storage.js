const OUTCOME_KEY = 'unspool:model-outcomes:v1';
const SESSION_KEY = 'unspool:sessions:v1';

function parse(value, fallback) {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
}

export function loadOutcomes() {
  return parse(localStorage.getItem(OUTCOME_KEY), {});
}

export function saveOutcomes(outcomes) {
  localStorage.setItem(OUTCOME_KEY, JSON.stringify(outcomes));
}

export function loadSessions() {
  return parse(localStorage.getItem(SESSION_KEY), []);
}

export function addSession(session) {
  const sessions = loadSessions();
  const minimized = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    interventionId: session.interventionId,
    before: session.before,
    after: session.after ?? null,
    helpful: session.helpful ?? null,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify([minimized, ...sessions].slice(0, 30)));
  return minimized;
}

export function clearPrivateData() {
  localStorage.removeItem(OUTCOME_KEY);
  localStorage.removeItem(SESSION_KEY);
}
