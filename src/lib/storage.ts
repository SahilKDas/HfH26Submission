import type { Outcomes } from '$shared/ranker';

const OUTCOME_KEY = 'unspool:model-outcomes:v2'; const SESSION_KEY = 'unspool:sessions:v2';
const LEGACY_OUTCOME_KEY = 'unspool:model-outcomes:v1'; const LEGACY_SESSION_KEY = 'unspool:sessions:v1';
export const AUDIO_SETTINGS_KEY = 'unspool:audio-settings:v1';
export type ExplicitOutcome = 'helped' | 'same' | 'harder';
export interface Session { id: string; createdAt: string; interventionId: string; before: number | null; after: number | null; outcome: ExplicitOutcome | null; completed: boolean; }
let demoOutcomes: Outcomes = {}; let demoSessions: Session[] = [];
function isBrowser(): boolean { return typeof window !== 'undefined' && typeof localStorage !== 'undefined'; }
export function isDemoMode(): boolean { return isBrowser() && new URLSearchParams(location.search).get('demo') === '1'; }
function parse<T>(value: string | null, fallback: T): T { try { return value ? (JSON.parse(value) as T) : fallback; } catch { return fallback; } }
function normalizeOutcomes(value: unknown): Outcomes {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([id, record]) => { const item = record as Partial<Outcomes[string]>; return [id, { helpful: Number(item.helpful) || 0, tried: Number(item.tried) || 0, harder: Number(item.harder) || 0 }]; }));
}
function normalizeSession(value: Partial<Session>): Session {
  const outcome = ['helped', 'same', 'harder'].includes(String(value.outcome)) ? value.outcome as ExplicitOutcome : null;
  return { id: value.id ?? crypto.randomUUID(), createdAt: value.createdAt ?? new Date().toISOString(), interventionId: String(value.interventionId ?? ''), before: Number.isFinite(value.before) ? Number(value.before) : null, after: Number.isFinite(value.after) ? Number(value.after) : null, outcome, completed: value.completed === true };
}
export function loadOutcomes(): Outcomes {
  if (!isBrowser()) return {}; if (isDemoMode()) return structuredClone(demoOutcomes);
  const current = parse<unknown>(localStorage.getItem(OUTCOME_KEY), null); if (current) return normalizeOutcomes(current);
  const migrated = normalizeOutcomes(parse(localStorage.getItem(LEGACY_OUTCOME_KEY), {})); if (Object.keys(migrated).length) localStorage.setItem(OUTCOME_KEY, JSON.stringify(migrated)); return migrated;
}
export function saveOutcomes(outcomes: Outcomes): void { if (!isBrowser()) return; if (isDemoMode()) demoOutcomes = structuredClone(outcomes); else localStorage.setItem(OUTCOME_KEY, JSON.stringify(outcomes)); }
export function recordOutcome(id: string, outcome: ExplicitOutcome): Outcomes {
  const outcomes = loadOutcomes(); const record = outcomes[id] ?? { helpful: 0, tried: 0, harder: 0 };
  outcomes[id] = { helpful: record.helpful + (outcome === 'helped' ? 1 : 0), tried: record.tried + 1, harder: record.harder + (outcome === 'harder' ? 1 : 0) };
  saveOutcomes(outcomes); return outcomes;
}
export function loadSessions(): Session[] {
  if (!isBrowser()) return []; if (isDemoMode()) return structuredClone(demoSessions);
  const current = parse<Partial<Session>[] | null>(localStorage.getItem(SESSION_KEY), null); if (current) return current.map(normalizeSession);
  const migrated = parse<Partial<Session>[]>(localStorage.getItem(LEGACY_SESSION_KEY), []).map((session) => normalizeSession({ ...session, after: null, outcome: null, completed: false }));
  if (migrated.length) localStorage.setItem(SESSION_KEY, JSON.stringify(migrated)); return migrated;
}
export function addSession(session: Omit<Session, 'id' | 'createdAt'>): Session {
  const minimized = normalizeSession({ ...session, id: crypto.randomUUID(), createdAt: new Date().toISOString() }); const sessions = [minimized, ...loadSessions()].slice(0, 30);
  if (isDemoMode()) demoSessions = sessions; else localStorage.setItem(SESSION_KEY, JSON.stringify(sessions)); return minimized;
}
export function clearPrivateData(): void { if (!isBrowser()) return; if (isDemoMode()) { demoOutcomes = {}; demoSessions = []; return; } for (const key of [OUTCOME_KEY, SESSION_KEY, LEGACY_OUTCOME_KEY, LEGACY_SESSION_KEY]) localStorage.removeItem(key); }
