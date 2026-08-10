import type { CheckInInput, RankedPractice } from '$shared/ranker';
import type { ExplicitOutcome } from '$lib/storage';

const CONSENT_MARKER = 'unspool:adaptive-consent:v1';

export interface AdaptiveCandidate extends RankedPractice {
  baseScore: number;
  expectedReward: number;
  uncertainty: number;
  learnedComponent: number;
}

export interface RecommendationResponse {
  decisionId: string | null;
  modelVersion: string;
  policySource: 'adaptive-v3';
  gate: { blocked: boolean; level: 'standard' | 'high' | 'urgent' | 'input' | 'options'; reason?: string };
  selected: AdaptiveCandidate | null;
  candidates: AdaptiveCandidate[];
  decisionMargin: number;
  decisionClarity: 'close' | 'clear';
  learningEnabled: boolean;
}

export interface RemoteSession {
  id: string;
  createdAt: string;
  practiceId: string;
  signals: string[];
  need: string;
  before: number;
  after: number | null;
  outcome: ExplicitOutcome | null;
  completed: boolean;
  modelVersion: string;
}

export interface ProfileInsights {
  consented: boolean;
  sessions: RemoteSession[];
  policy: Record<string, { helpful: number; tried: number; harder: number }>;
  retentionDays: number;
}

export interface ModelRoomStatus {
  activeModel: string;
  baselineModel: string;
  retainedOutcomeCount: number;
  minimumForChallenger: number;
  featureCount: number;
  lastEvaluation: string | null;
  promotionState: 'baseline' | 'candidate' | 'active' | 'rejected';
  metrics: Record<string, unknown>;
}

export interface SimulationReport {
  schemaVersion: 1;
  modelVersion: string;
  seed: number;
  generatedAt: string;
  synthetic: true;
  trainingInteractions: number;
  evaluationScenarios: number;
  featureCount: number;
  baselineReward: number;
  challengerReward: number;
  simulatedImprovement: number;
  challengerRegret: number;
  unsafeSelections: number;
  constraintViolations: number;
  selectionDistribution: Record<string, number>;
  practiceCoverage: number;
  decisionMargin: { minimum: number; mean: number; p05: number };
  passed: boolean;
  limitations: string[];
}

export interface JobStatus {
  jobId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  modelVersion: string;
  kind: 'simulation' | 'training';
  report?: SimulationReport;
  message?: string;
}

function csrfToken(): string {
  if (typeof document === 'undefined') return '';
  return document.cookie.split('; ').find((item) => item.startsWith('csrftoken='))?.split('=')[1] ?? '';
}

async function requestJson<T>(path: string, init: RequestInit = {}, timeout = 5_000): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const headers = new Headers(init.headers);
    if (init.body) headers.set('Content-Type', 'application/json');
    const token = csrfToken();
    if (token) headers.set('X-CSRFToken', decodeURIComponent(token));
    const response = await fetch(path, { ...init, headers, credentials: 'same-origin', signal: controller.signal });
    const value = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new Error(value?.error?.detail ?? value?.error?.detail?.detail ?? `Request failed with ${response.status}`);
    return value as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export function learningConsentPreferred(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(CONSENT_MARKER) === 'yes' && new URLSearchParams(location.search).get('demo') !== '1';
}

export async function ensureLearningConsent(): Promise<void> {
  await requestJson('/api/v1/models/active');
  await requestJson('/api/v1/profile/consent', { method: 'POST', body: '{}' });
  localStorage.setItem(CONSENT_MARKER, 'yes');
}

export async function deleteAdaptiveProfile(): Promise<void> {
  await requestJson('/api/v1/models/active');
  await requestJson('/api/v1/profile', { method: 'DELETE' });
  localStorage.removeItem(CONSENT_MARKER);
}

export async function requestRecommendation(input: CheckInInput): Promise<RecommendationResponse> {
  await requestJson('/api/v1/models/active', {}, 2_000);
  return requestJson<RecommendationResponse>('/api/v1/recommendations', { method: 'POST', body: JSON.stringify(input) }, 2_500);
}

export async function submitOutcome(decisionId: string, value: { outcome: ExplicitOutcome; after: number | null; completed: boolean; elapsedSeconds: number }): Promise<void> {
  await requestJson(`/api/v1/decisions/${decisionId}/outcome`, {
    method: 'POST',
    body: JSON.stringify({ idempotencyKey: crypto.randomUUID(), ...value }),
  });
}

export function getProfileInsights(): Promise<ProfileInsights> {
  return requestJson('/api/v1/profile/insights');
}

export function getModelRoomStatus(): Promise<ModelRoomStatus> {
  return requestJson('/api/v1/models/active');
}

export async function startSimulation(): Promise<JobStatus> {
  await requestJson('/api/v1/models/active');
  return requestJson('/api/v1/simulations', { method: 'POST', body: '{}' });
}

export function getJob(jobId: string): Promise<JobStatus> {
  return requestJson(`/api/v1/jobs/${jobId}`);
}
