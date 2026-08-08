import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AUDIO_SETTINGS_KEY } from './storage.js';

export const LOFI_STREAM_URL = 'https://radio.loficafe.net/listen/chilling/radio.mp3';

const AudioContext = createContext(null);

function readSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(AUDIO_SETTINGS_KEY) || '{}');
    return {
      radioVolume: Number.isFinite(stored.radioVolume) ? Math.min(1, Math.max(0, stored.radioVolume)) : 0.24,
      cuesEnabled: stored.cuesEnabled === true,
      cueVolume: Number.isFinite(stored.cueVolume) ? Math.min(1, Math.max(0, stored.cueVolume)) : 0.35,
    };
  } catch {
    return { radioVolume: 0.24, cuesEnabled: false, cueVolume: 0.35 };
  }
}

export function AudioProvider({ children }) {
  const initial = useMemo(readSettings, []);
  const audioRef = useRef(null);
  const toneContextRef = useRef(null);
  const restoreTimerRef = useRef(null);
  const [radioVolume, setRadioVolume] = useState(initial.radioVolume);
  const [cuesEnabled, setCuesEnabled] = useState(initial.cuesEnabled);
  const [cueVolume, setCueVolume] = useState(initial.cueVolume);
  const [radioStatus, setRadioStatus] = useState('idle');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audio.volume = radioVolume;
    const onPlaying = () => setRadioStatus('playing');
    const onWaiting = () => setRadioStatus('connecting');
    const onPause = () => setRadioStatus((status) => status === 'error' ? status : 'paused');
    const onError = () => setRadioStatus('error');
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('error', onError);
    audioRef.current = audio;
    return () => {
      window.clearTimeout(restoreTimerRef.current);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('error', onError);
      toneContextRef.current?.close?.();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = radioVolume;
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify({ radioVolume, cuesEnabled, cueVolume }));
  }, [radioVolume, cuesEnabled, cueVolume]);

  const playRadio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      setRadioStatus('connecting');
      if (!audio.src) audio.src = LOFI_STREAM_URL;
      await audio.play();
    } catch {
      setRadioStatus('error');
    }
  }, []);

  const pauseRadio = useCallback(() => audioRef.current?.pause(), []);

  const retryRadio = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    await playRadio();
  }, [playRadio]);

  const playCue = useCallback(async (kind = 'transition') => {
    if (!cuesEnabled) return;
    const NativeAudioContext = window.AudioContext || window.webkitAudioContext;
    if (!NativeAudioContext) return;
    try {
      const context = toneContextRef.current || new NativeAudioContext();
      toneContextRef.current = context;
      if (context.state === 'suspended') await context.resume();
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const frequencies = { start: 392, transition: 440, pause: 294, complete: 523 };
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencies[kind] || frequencies.transition, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, cueVolume * 0.12), now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.36);

      const audio = audioRef.current;
      if (audio && !audio.paused) {
        window.clearTimeout(restoreTimerRef.current);
        audio.volume = radioVolume * 0.28;
        restoreTimerRef.current = window.setTimeout(() => {
          if (audioRef.current) audioRef.current.volume = radioVolume;
        }, 520);
      }
    } catch {
      // Visual and screen-reader cues remain available when Web Audio is unavailable.
    }
  }, [cueVolume, cuesEnabled, radioVolume]);

  const value = useMemo(() => ({
    radioStatus,
    radioVolume,
    setRadioVolume,
    playRadio,
    pauseRadio,
    retryRadio,
    expanded,
    setExpanded,
    cuesEnabled,
    setCuesEnabled,
    cueVolume,
    setCueVolume,
    playCue,
  }), [radioStatus, radioVolume, playRadio, pauseRadio, retryRadio, expanded, cuesEnabled, cueVolume, playCue]);

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio() {
  const value = useContext(AudioContext);
  if (!value) throw new Error('useAudio must be used within AudioProvider');
  return value;
}
