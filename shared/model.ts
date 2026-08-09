export const MODEL_VERSION = 'unspool-ranker-v2' as const;

export const SIGNAL_IDS = [
  'racing', 'tight-chest', 'overstimulated', 'unreal', 'restless',
  'shutdown', 'sad', 'shame', 'irritable', 'numb',
] as const;
export type SignalId = (typeof SIGNAL_IDS)[number];

export const NEED_IDS = ['grounding', 'quiet', 'release', 'connection', 'clarity', 'settle'] as const;
export type NeedId = (typeof NEED_IDS)[number];

export const CAPACITY_OPTIONS = [45, 90, 180] as const;
export type Capacity = (typeof CAPACITY_OPTIONS)[number];
export const ACCESS_KEYS = ['noBreath', 'eyesOpen', 'silent', 'seated'] as const;
export type AccessKey = (typeof ACCESS_KEYS)[number];
export type Preferences = Record<AccessKey, boolean>;

export interface PracticeSpec {
  id: string;
  duration: number;
  signals: readonly SignalId[];
  needs: readonly NeedId[];
  modes: readonly string[];
  intensityRange: readonly [number, number];
  evidence: string;
  constraints: readonly string[];
}

const practices: PracticeSpec[] = [
  { id: 'orient-five', duration: 90, signals: ['racing', 'unreal', 'overstimulated'], needs: ['grounding', 'clarity'], modes: ['eyes-open', 'silent', 'seated', 'standing'], intensityRange: [4, 10], evidence: 'sensory grounding', constraints: [] },
  { id: 'pressure-anchor', duration: 60, signals: ['unreal', 'numb', 'overstimulated'], needs: ['grounding', 'settle'], modes: ['eyes-open', 'eyes-closed', 'silent', 'seated'], intensityRange: [3, 10], evidence: 'proprioceptive grounding', constraints: [] },
  { id: 'longer-out', duration: 75, signals: ['tight-chest', 'racing', 'restless'], needs: ['settle'], modes: ['eyes-open', 'eyes-closed', 'audio', 'seated', 'standing'], intensityRange: [2, 8], evidence: 'paced breathing', constraints: ['breath-focused'] },
  { id: 'micro-movement', duration: 90, signals: ['restless', 'tight-chest', 'overstimulated', 'irritable'], needs: ['release', 'settle'], modes: ['eyes-open', 'silent', 'seated', 'standing'], intensityRange: [3, 10], evidence: 'controlled motor discharge', constraints: [] },
  { id: 'reduce-input', duration: 45, signals: ['overstimulated', 'irritable', 'shutdown'], needs: ['quiet', 'clarity'], modes: ['eyes-open', 'silent', 'seated', 'standing'], intensityRange: [2, 10], evidence: 'stimulus reduction', constraints: [] },
  { id: 'one-true-sentence', duration: 60, signals: ['racing', 'sad', 'shame', 'shutdown'], needs: ['clarity', 'connection'], modes: ['eyes-open', 'silent', 'seated'], intensityRange: [1, 7], evidence: 'affect labeling', constraints: ['low-intensity-reflection'] },
  { id: 'warm-cool', duration: 75, signals: ['numb', 'unreal', 'shutdown', 'racing'], needs: ['grounding', 'settle'], modes: ['eyes-open', 'silent', 'seated', 'standing'], intensityRange: [3, 9], evidence: 'sensory orientation', constraints: [] },
  { id: 'borrow-a-nervous-system', duration: 120, signals: ['sad', 'tight-chest', 'shame', 'shutdown'], needs: ['connection', 'grounding'], modes: ['eyes-open', 'audio', 'seated', 'standing'], intensityRange: [4, 10], evidence: 'social co-regulation', constraints: [] },
];

export const MODEL_SPEC: readonly PracticeSpec[] = Object.freeze(practices.map((practice) => Object.freeze(practice)));

export function isSignal(value: unknown): value is SignalId { return SIGNAL_IDS.includes(value as SignalId); }
export function isNeed(value: unknown): value is NeedId { return NEED_IDS.includes(value as NeedId); }
export function isCapacity(value: unknown): value is Capacity { return CAPACITY_OPTIONS.includes(value as Capacity); }
