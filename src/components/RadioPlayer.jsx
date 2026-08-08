import { ChevronDown, ExternalLink, Pause, Play, Radio, RefreshCcw, Volume2, X } from 'lucide-react';
import { useAudio } from '../lib/audio.jsx';

export default function RadioPlayer({ hidden = false }) {
  const {
    radioStatus, radioVolume, setRadioVolume, playRadio, pauseRadio, retryRadio, expanded, setExpanded,
  } = useAudio();
  if (hidden) return null;
  const playing = radioStatus === 'playing';
  const connecting = radioStatus === 'connecting';

  return (
    <aside className={`lofi-player ${expanded ? 'expanded' : ''}`} aria-label="Unspool lofi radio">
      <div className="lofi-main-row">
        <button
          className="lofi-play"
          onClick={radioStatus === 'error' ? retryRadio : playing ? pauseRadio : playRadio}
          aria-label={radioStatus === 'error' ? 'Retry lofi radio' : playing ? 'Pause lofi radio' : 'Play lofi radio'}
          aria-describedby="lofi-provider-notice"
        >
          {radioStatus === 'error' ? <RefreshCcw /> : playing ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
        </button>
        <button className="lofi-summary" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
          <span className={`lofi-signal ${playing ? 'live' : ''}`}><Radio /></span>
          <span><b>quiet frequency</b><small>{connecting ? 'connecting…' : radioStatus === 'error' ? 'station unavailable' : playing ? 'chilling live' : 'Lofi Cafe · external'}</small></span>
          {expanded ? <X /> : <ChevronDown />}
        </button>
      </div>
      <div className="lofi-details" aria-hidden={!expanded}>
        <label>
          <Volume2 />
          <span className="sr-only">Radio volume</span>
          <input type="range" min="0" max="1" step="0.05" value={radioVolume} onChange={(event) => setRadioVolume(Number(event.target.value))} />
          <small>{Math.round(radioVolume * 100)}%</small>
        </label>
        <p>Optional ambience, not a health intervention. Pressing play contacts Lofi Cafe; no check-in data is shared.</p>
        <a href="https://loficafe.net/" target="_blank" rel="noreferrer">Stream by Lofi Cafe <ExternalLink /></a>
      </div>
      <span className="sr-only" aria-live="polite">Radio status: {radioStatus}</span>
      <span id="lofi-provider-notice" className="sr-only">Playing contacts the external Lofi Cafe stream. No Unspool check-in data is shared.</span>
    </aside>
  );
}
