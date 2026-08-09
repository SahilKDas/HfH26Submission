<script lang="ts">
  import Play from '@lucide/svelte/icons/play';
  import Pause from '@lucide/svelte/icons/pause';
  import ChevronUp from '@lucide/svelte/icons/chevron-up';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Radio from '@lucide/svelte/icons/radio';
  import { audioState, playRadio, pauseRadio, retryRadio, setRadioVolume, setExpanded } from '$lib/audio';
</script>

<aside class="lofi-player" class:expanded={$audioState.expanded} aria-label="Optional lofi radio">
  <div class="lofi-main-row">
    <button class="lofi-play" aria-label={$audioState.radioStatus === 'playing' ? 'Pause lofi radio' : 'Play lofi radio'} onclick={$audioState.radioStatus === 'playing' ? pauseRadio : playRadio}>
      {#if $audioState.radioStatus === 'playing'}<Pause />{:else}<Play />{/if}
    </button>
    <button class="lofi-summary" aria-label={$audioState.expanded ? 'Collapse radio controls' : 'Expand radio controls'} onclick={() => setExpanded(!$audioState.expanded)}>
      <span class:live={$audioState.radioStatus === 'playing'} class="lofi-signal"><Radio size={13} /></span>
      <span><b>Lofi companion</b><small aria-live="polite">{$audioState.radioStatus === 'idle' ? 'Off — no connection made' : $audioState.radioStatus}</small></span>
      {#if $audioState.expanded}<ChevronDown />{:else}<ChevronUp />{/if}
    </button>
  </div>
  {#if $audioState.expanded}
    <div class="lofi-details">
      <label><Radio /><input aria-label="Radio volume" type="range" min="0" max="1" step="0.01" value={$audioState.radioVolume} oninput={(event) => setRadioVolume(Number(event.currentTarget.value))} /><small>{Math.round($audioState.radioVolume * 100)}%</small></label>
      {#if $audioState.radioStatus === 'error'}<p>Stream unavailable. <button onclick={retryRadio}><RotateCcw size={12} /> Retry</button></p>{/if}
      <p>Pressing Play contacts <a href="https://loficafe.net/" target="_blank" rel="noreferrer">Lofi Cafe</a>, which receives ordinary network metadata. No check-in or private-model data is sent.</p>
    </div>
  {/if}
</aside>
