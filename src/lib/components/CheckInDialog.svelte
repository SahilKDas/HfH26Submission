<script lang="ts">
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import X from '@lucide/svelte/icons/x';
  import { signalOptions, needOptions } from '$lib/data';
  import { focusTrap } from '$lib/focus';
  import type { CheckInInput } from '$shared/ranker';
  import type { AccessKey, Capacity, NeedId, Preferences, SignalId } from '$shared/model';
  export let initial: CheckInInput | null = null;
  export let onClose: () => void; export let onComplete: (input: CheckInInput) => void; export let onCrisis: () => void;
  let step = 1; let signals: SignalId[] = initial?.signals ? [...initial.signals] : [];
  let need: NeedId | null = initial?.need ?? null; let intensity = initial?.intensity ?? 5; let capacity: Capacity = initial?.capacity ?? 90;
  let preferences: Preferences = initial?.preferences ? { ...initial.preferences } : { noBreath: false, eyesOpen: false, silent: false, seated: false };
  let error = ''; let processing = false;
  const accessRows: { key: AccessKey; title: string; copy: string }[] = [
    { key: 'noBreath', title: 'Skip breath-focused steps', copy: 'Exclude any practice that directs attention to breathing.' },
    { key: 'eyesOpen', title: 'Keep my eyes open', copy: 'Only show practices designed for an eyes-open state.' },
    { key: 'silent', title: 'I need silence', copy: 'Exclude practices that rely on audio.' },
    { key: 'seated', title: 'I need to stay seated', copy: 'Only show practices with a seated version.' },
  ];
  function toggleSignal(id: SignalId) { signals = signals.includes(id) ? signals.filter((item) => item !== id) : [...signals, id]; error = ''; }
  function next() { if (step === 1 && !signals.length) { error = 'Choose at least one body signal before continuing.'; return; } if (step === 2 && !need) { error = 'Choose what would help most right now.'; return; } error = ''; step += 1; }
  function finish() {
    if (!need) return; const selectedNeed = need; processing = true;
    window.setTimeout(() => onComplete({ signals, need: selectedNeed, intensity, capacity, preferences, immediateDanger: false }), 550);
  }
  function handleKey(event: KeyboardEvent) { if (event.key === 'Escape' && !processing) onClose(); }
</script>

<svelte:window onkeydown={handleKey} />
<div class="modal-backdrop" role="presentation">
  <div class="checkin-modal" role="dialog" aria-modal="true" aria-labelledby="checkin-title" use:focusTrap>
    <header class="checkin-header"><span class="privacy-chip"><LockKeyhole size={14} /> Private on this device</span><button class="icon-button" aria-label="Close check-in" onclick={onClose}><X /></button></header>
    <div class="progress-rail" aria-hidden="true"><span style={`width:${step / 3 * 100}%`}></span></div>
    <div class="checkin-content">
      <div class="step-meta"><span>0{step}</span><p>/ 03</p></div>
      {#if step === 1}
        <div class="checkin-step"><span class="eyebrow coral">Start with sensation</span><h1 id="checkin-title" tabindex="-1">What is your body telling you?</h1><p class="step-lede">Choose every signal that fits. There is no text box and nothing leaves this device.</p>
          <div class="signal-grid">{#each signalOptions as option}<button class="signal-option" class:selected={signals.includes(option.id)} aria-pressed={signals.includes(option.id)} onclick={() => toggleSignal(option.id)}><span class="signal-icon" aria-hidden="true">{option.label.slice(0, 1)}</span><span>{option.label}</span><i aria-hidden="true">{#if signals.includes(option.id)}<Check size={13} />{:else}<span class="plus-line"></span>{/if}</i></button>{/each}</div>
        </div>
      {:else if step === 2}
        <div class="checkin-step"><span class="eyebrow coral">Choose direction</span><h1 id="checkin-title" tabindex="-1">What would help most?</h1><p class="step-lede">This steers the ranking. It does not diagnose why you feel this way.</p>
          <div class="need-grid">{#each needOptions as option}<button class:selected={need === option.id} aria-pressed={need === option.id} onclick={() => { need = option.id; error = ''; }}>{option.label}{#if need === option.id}<Check size={15} />{/if}</button>{/each}</div>
          <div class="range-card"><div class="range-heading"><label for="intensity">Intensity right now</label><strong>{intensity}</strong></div><input id="intensity" type="range" min="1" max="10" bind:value={intensity} style={`--range:${(intensity - 1) / 9 * 100}%`} /><div class="range-labels"><span>low</span><span>high</span></div></div>
          <fieldset class="capacity-field"><legend>Time available</legend><div>{#each [45, 90, 180] as seconds}<button class:selected={capacity === seconds} aria-pressed={capacity === seconds} onclick={() => capacity = seconds as Capacity}>{seconds === 45 ? 'About 45 sec' : seconds === 90 ? 'About 90 sec' : 'About 3 min'}</button>{/each}</div></fieldset>
        </div>
      {:else}
        <div class="checkin-step preferences-step"><span class="eyebrow coral">Access settings</span><h1 id="checkin-title" tabindex="-1">Make the step fit you.</h1><p class="step-lede">These are hard constraints. Incompatible practices are removed before scoring.</p>
          <div class="preference-list">{#each accessRows as row}<label class="preference-row"><span class="preference-icon" aria-hidden="true">{row.title.slice(0, 1)}</span><span class="preference-copy"><b>{row.title}</b><small>{row.copy}</small></span><input type="checkbox" checked={preferences[row.key]} onchange={(event) => preferences = { ...preferences, [row.key]: event.currentTarget.checked }} /><span class="toggle" aria-hidden="true"><span></span></span></label>{/each}</div>
          <div class="review-card"><div><Check size={17} /><span><b>{signals.length} signal{signals.length === 1 ? '' : 's'} · intensity {intensity} · {capacity} seconds</b><small>{needOptions.find((item) => item.id === need)?.label}</small></span></div><button onclick={() => step = 1}>Edit</button></div>
        </div>
      {/if}
      {#if error}<p class="checkin-error" role="alert"><ShieldAlert size={16} /> {error}</p>{/if}
      {#if processing}<div class="processing-overlay" role="status"><div class="processing-orbit"><span></span><span></span><ShieldAlert size={28} /></div><h2>Checking every constraint</h2><p>Ranking locally with unspool-ranker-v2.</p><ul><li class="done"><Check /> Safety gate</li><li class="done"><Check /> Access exclusions</li><li class="done"><Check /> Explainable score</li></ul></div>{/if}
    </div>
    <footer class="checkin-footer">
      <button class="back-button" onclick={() => step > 1 ? step -= 1 : onClose()}><ArrowLeft size={15} /> {step > 1 ? 'Back' : 'Cancel'}</button>
      <button class="back-button" onclick={onCrisis}><ShieldAlert size={14} /> I may not be safe</button>
      {#if step < 3}<button class="primary-button" onclick={next}>Continue <ArrowRight size={15} /></button>{:else}<button class="primary-button" onclick={finish}>Create my step <ArrowRight size={15} /></button>{/if}
    </footer>
  </div>
</div>
