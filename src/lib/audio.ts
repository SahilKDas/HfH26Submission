import { browser } from '$app/environment';
import { get, writable } from 'svelte/store';
import { AUDIO_SETTINGS_KEY, isDemoMode } from './storage';

export const LOFI_STREAM_URL = 'https://radio.loficafe.net/listen/chilling/radio.mp3';
export type RadioStatus = 'idle' | 'connecting' | 'playing' | 'paused' | 'error';
interface AudioState { radioStatus: RadioStatus; radioVolume: number; cuesEnabled: boolean; cueVolume: number; expanded: boolean; }
const defaults: AudioState = { radioStatus: 'idle', radioVolume: 0.24, cuesEnabled: false, cueVolume: 0.35, expanded: false };
export const audioState = writable<AudioState>(defaults);
let radio: HTMLAudioElement | null = null; let toneContext: AudioContext | null = null; let restoreTimer = 0;
function clamp(value: number): number { return Math.min(1, Math.max(0, value)); }
function persist(state: AudioState): void { if (browser && !isDemoMode()) localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({ radioVolume: state.radioVolume, cuesEnabled: state.cuesEnabled, cueVolume: state.cueVolume })); }
export function initAudio(): () => void {
  if (!browser || radio) return () => undefined;
  if (!isDemoMode()) { try { const saved = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) ?? '{}') as Partial<AudioState>; audioState.update((state) => ({ ...state, radioVolume: Number.isFinite(saved.radioVolume) ? clamp(Number(saved.radioVolume)) : state.radioVolume, cuesEnabled: saved.cuesEnabled === true, cueVolume: Number.isFinite(saved.cueVolume) ? clamp(Number(saved.cueVolume)) : state.cueVolume })); } catch { /* defaults remain */ } }
  radio = new Audio(); radio.preload = 'none'; radio.volume = get(audioState).radioVolume;
  radio.addEventListener('playing', () => audioState.update((state) => ({ ...state, radioStatus: 'playing' })));
  radio.addEventListener('waiting', () => audioState.update((state) => ({ ...state, radioStatus: 'connecting' })));
  radio.addEventListener('pause', () => audioState.update((state) => ({ ...state, radioStatus: state.radioStatus === 'error' ? 'error' : 'paused' })));
  radio.addEventListener('error', () => audioState.update((state) => ({ ...state, radioStatus: 'error' })));
  return () => { window.clearTimeout(restoreTimer); radio?.pause(); radio?.removeAttribute('src'); radio?.load(); radio = null; void toneContext?.close(); toneContext = null; };
}
export function setRadioVolume(value: number): void { audioState.update((state) => { const next = { ...state, radioVolume: clamp(value) }; if (radio) radio.volume = next.radioVolume; persist(next); return next; }); }
export function setCueVolume(value: number): void { audioState.update((state) => { const next = { ...state, cueVolume: clamp(value) }; persist(next); return next; }); }
export function setCuesEnabled(value: boolean): void { audioState.update((state) => { const next = { ...state, cuesEnabled: value }; persist(next); return next; }); }
export function setExpanded(value: boolean): void { audioState.update((state) => ({ ...state, expanded: value })); }
export async function playRadio(): Promise<void> { if (!radio) initAudio(); if (!radio) return; try { audioState.update((state) => ({ ...state, radioStatus: 'connecting' })); if (!radio.src) radio.src = LOFI_STREAM_URL; await radio.play(); } catch { audioState.update((state) => ({ ...state, radioStatus: 'error' })); } }
export function pauseRadio(): void { radio?.pause(); }
export async function retryRadio(): Promise<void> { radio?.pause(); radio?.removeAttribute('src'); radio?.load(); await playRadio(); }
export async function playCue(kind: 'start' | 'transition' | 'pause' | 'complete' = 'transition'): Promise<void> {
  const state = get(audioState); if (!state.cuesEnabled || !browser) return; const AudioContextClass = window.AudioContext; if (!AudioContextClass) return;
  try { toneContext ??= new AudioContextClass(); if (toneContext.state === 'suspended') await toneContext.resume(); const now = toneContext.currentTime; const oscillator = toneContext.createOscillator(); const gain = toneContext.createGain(); const frequencies = { start: 392, transition: 440, pause: 294, complete: 523 }; oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequencies[kind], now); gain.gain.setValueAtTime(0.0001, now); gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, state.cueVolume * 0.12), now + 0.025); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34); oscillator.connect(gain).connect(toneContext.destination); oscillator.start(now); oscillator.stop(now + 0.36); if (radio && !radio.paused) { clearTimeout(restoreTimer); radio.volume = state.radioVolume * 0.28; restoreTimer = window.setTimeout(() => { if (radio) radio.volume = get(audioState).radioVolume; }, 520); } } catch { /* visible cues remain */ }
}
