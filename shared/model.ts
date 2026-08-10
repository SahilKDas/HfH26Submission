import practiceDocument from './practices.json';

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

if (practiceDocument.modelVersion !== MODEL_VERSION) throw new Error(`Practice specification version ${practiceDocument.modelVersion} does not match ${MODEL_VERSION}`);
const practices: PracticeSpec[] = practiceDocument.practices.map((practice) => ({
  ...practice,
  signals: practice.signals as SignalId[],
  needs: practice.needs as NeedId[],
  intensityRange: practice.intensityRange as [number, number],
}));

export const MODEL_SPEC: readonly PracticeSpec[] = Object.freeze(practices.map((practice) => Object.freeze(practice)));

export function isSignal(value: unknown): value is SignalId { return SIGNAL_IDS.includes(value as SignalId); }
export function isNeed(value: unknown): value is NeedId { return NEED_IDS.includes(value as NeedId); }
export function isCapacity(value: unknown): value is Capacity { return CAPACITY_OPTIONS.includes(value as Capacity); }
