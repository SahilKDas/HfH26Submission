<script lang="ts">
  import { onDestroy } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Check from '@lucide/svelte/icons/check';
  import ChevronLeft from '@lucide/svelte/icons/chevron-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Clipboard from '@lucide/svelte/icons/clipboard';
  import Info from '@lucide/svelte/icons/info';
  import Pause from '@lucide/svelte/icons/pause';
  import Play from '@lucide/svelte/icons/play';
  import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
  import Share2 from '@lucide/svelte/icons/share-2';
  import ShieldAlert from '@lucide/svelte/icons/shield-alert';
  import SkipBack from '@lucide/svelte/icons/skip-back';
  import Square from '@lucide/svelte/icons/square';
  import Volume2 from '@lucide/svelte/icons/volume-2';
  import X from '@lucide/svelte/icons/x';
  import type { Practice } from '$lib/data';
  import type { CheckInInput, RankedPractice } from '$shared/ranker';
  import type { ExplicitOutcome } from '$lib/storage';
  import { addSession, recordOutcome } from '$lib/storage';
  import { audioState, playCue, setCuesEnabled, setCueVolume } from '$lib/audio';
  import { focusTrap } from '$lib/focus';
  export let practice: Practice & RankedPractice; export let input: CheckInInput;
  export let onClose: () => void; export let onAgain: () => void; export let onReject: (input: CheckInInput) => void; export let onCrisis: () => void; export let onSaved: () => void;
  let whyOpen = false; let guided = false; let running = false; let elapsed = 0; let anchor = 0; let accumulated = 0; let timer = 0;
  let completed = false; let feedbackOpen = false; let after: number | null = null; let recorded = false; let copied = false; let cuePulse = 0;
  $: boundaries = practice.steps.map((_, index) => practice.steps.slice(0, index).reduce((sum, step) => sum + step.time, 0));
  $: currentStep = Math.min(practice.steps.length - 1, Math.max(0, boundaries.findLastIndex((boundary) => elapsed >= boundary)));
  $: progress = Math.min(100, elapsed / practice.duration * 100);
  $: remaining = Math.max(0, Math.ceil(practice.duration - elapsed));
  function tick() { elapsed = Math.min(practice.duration, accumulated + (Date.now() - anchor) / 1000); if (elapsed >= practice.duration) complete(); }
  function start() { if (completed) return; anchor = Date.now(); accumulated = elapsed; running = true; clearInterval(timer); timer = window.setInterval(tick, 150); void cue('start'); }
  function pause() { if (!running) return; tick(); accumulated = elapsed; running = false; clearInterval(timer); void cue('pause'); }
  function seek(value: number) { pause(); elapsed = Math.min(practice.duration, Math.max(0, value)); accumulated = elapsed; }
  function previous() { seek(boundaries[Math.max(0, currentStep - 1)] ?? 0); void cue('transition'); }
  function next() { const nextBoundary = boundaries[currentStep + 1]; if (nextBoundary === undefined) complete(); else { seek(nextBoundary); void cue('transition'); } }
  function restart() { pause(); elapsed = 0; accumulated = 0; completed = false; feedbackOpen = false; void cue('transition'); }
  async function cue(kind: 'start' | 'transition' | 'pause' | 'complete') { cuePulse += 1; await playCue(kind); }
  function complete() { clearInterval(timer); running = false; elapsed = practice.duration; accumulated = elapsed; completed = true; guided = false; feedbackOpen = true; void cue('complete'); }
  function stop() { pause(); guided = false; if (elapsed >= 15) feedbackOpen = true; else onClose(); }
  function save(outcome: ExplicitOutcome | null) {
    if (recorded) return; addSession({ interventionId: practice.id, before: input.intensity, after, outcome, completed }); if (outcome) recordOutcome(practice.id, outcome); recorded = true; onSaved();
  }
  async function shareBridge() { try { if (navigator.share) await navigator.share({ title: 'A small ask from Unspool', text: practice.bridge }); else { await navigator.clipboard.writeText(practice.bridge); copied = true; } } catch { /* user cancelled */ } }
  function guidedKeys(event: KeyboardEvent) {
    if (!guided || ['INPUT', 'BUTTON'].includes((event.target as HTMLElement).tagName)) return;
    if (event.key === ' ') { event.preventDefault(); running ? pause() : start(); }
    if (event.key === 'ArrowLeft') previous(); if (event.key === 'ArrowRight') next(); if (event.key.toLowerCase() === 'r') restart(); if (event.key === 'Escape') stop();
  }
  onDestroy(() => clearInterval(timer));
</script>

<svelte:window onkeydown={guidedKeys} />
<div class="plan-page">
  <header class="plan-header"><button class="brand" onclick={onClose}><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>Unspool</button><span class="privacy-chip">Chosen locally · {practice.confidence}% fit</span><button class="icon-button" aria-label="Close practice" onclick={onClose}><X /></button></header>
  <main class="plan-main" id="main-content">
    <section class="plan-intro"><span class="eyebrow coral">Your next step</span><h1>{practice.name}</h1><p>{practice.short}</p>
      <div class="plan-intro-actions"><button class="guide-button" onclick={() => guided = true}><Play size={15} /> Guide me step by step</button><button class="not-for-me" onclick={() => onReject(input)}>This step isn’t for me</button></div>
      <div class="cue-settings"><label><input type="checkbox" checked={$audioState.cuesEnabled} onchange={(event) => setCuesEnabled(event.currentTarget.checked)} /> Optional nonverbal cues</label><label class="cue-volume">Cue volume <input aria-label="Cue volume" type="range" min="0" max="1" step=".05" value={$audioState.cueVolume} oninput={(event) => setCueVolume(Number(event.currentTarget.value))} /></label></div>
      <button class="why-button" aria-expanded={whyOpen} onclick={() => whyOpen = !whyOpen}><Info size={14} /> Why this step? <ChevronRight size={14} /></button>
      {#if whyOpen}<div class="why-panel"><div class="reason-chips">{#each practice.explanation.matchedSignals as signal}<span>{signal}</span>{/each}{#if practice.explanation.needMatched}<span>need matched</span>{/if}<span>{practice.explanation.learning}</span></div><p>{practice.why}</p><small><Info size={13} /> Literature-informed, not clinical advice or a treatment claim.</small></div>{/if}
    </section>
    <section class="practice-card">
      <div class="timer-column"><div class="timer-ring"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="45"></circle><circle class="progress" cx="50" cy="50" r="45" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100"></circle></svg><div><strong>{practice.duration}</strong><span>seconds</span></div></div><button class="timer-control" onclick={() => guided = true}><Play /> Start guided mode</button><button class="reset-link" onclick={restart}><RefreshCcw /> Restart</button></div>
      <div class="steps-column">{#each practice.steps as step, index}<article><span>{index + 1}</span><div><div class="step-title-row"><h3>{step.title}</h3><small>{step.time}s</small></div><p>{step.body}</p></div></article>{/each}{#each practice.cautions as caution}<p class="caution"><ShieldAlert size={14} /> {caution}</p>{/each}</div>
    </section>
    <section class="bridge-card"><span class="bridge-icon"><Share2 /></span><div><span class="eyebrow">A bridge to another person</span><h2>If doing this alone is too much</h2><blockquote>“{practice.bridge}”</blockquote></div><button onclick={shareBridge}>{#if copied}<Check /> Copied{:else}<Clipboard /> Share sentence{/if}</button></section>
    {#if feedbackOpen}
      <section class="feedback-card feedback-open" aria-labelledby="feedback-title">
        {#if recorded}<div class="feedback-thanks"><span><Check /></span><div><h2 id="feedback-title">Recorded privately.</h2><p>Your explicit response—not an inferred score—updates this device only.</p><button onclick={onClose}>Return home</button></div></div>
        {:else}<div class="feedback-form"><div><span class="eyebrow coral">Optional explicit feedback</span><h2 id="feedback-title">Where is the intensity now?</h2><p>Choose a number only if you want to. Unspool never invents an after score.</p></div><div class="after-scale">{#each Array(10) as _, index}<button aria-pressed={after === index + 1} onclick={() => after = index + 1}>{index + 1}</button>{/each}</div><div><h2>What happened?</h2><div class="outcome-actions"><button onclick={() => save('helped')}>Helped</button><button onclick={() => save('same')}>About the same</button><button onclick={() => save('harder')}>Made it harder</button></div></div><button class="skip-feedback" onclick={() => save(null)}>Skip feedback</button></div>{/if}
      </section>
    {/if}
    <div class="plan-actions"><button onclick={onAgain}><RefreshCcw size={13} /> Start another check-in</button><button onclick={onCrisis}><ShieldAlert size={13} /> Crisis support</button></div>
  </main>
</div>

{#if guided}
  <div class="guided-mode" role="dialog" aria-modal="true" aria-labelledby="guided-title" use:focusTrap>
    <header><button class="brand" onclick={stop}><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>Unspool</button><span class="pill">Low-stimulation guided mode</span><button onclick={stop}><X /> Stop and exit</button></header>
    <main>
      <span class="eyebrow">Step {currentStep + 1} of {practice.steps.length} · {remaining}s left</span>
      <h1 id="guided-title">{practice.steps[currentStep]?.title}</h1><p>{practice.steps[currentStep]?.body}</p>
      {#key cuePulse}<div class="guided-cue-pulse" aria-hidden="true"></div>{/key}
      <div class="guided-progress" aria-hidden="true"><span style={`width:${progress}%`}></span></div>
      <p class="sr-only" aria-live="polite">{running ? `Running step ${currentStep + 1}` : `Paused on step ${currentStep + 1}`}</p>
      <div class="guided-controls"><button aria-label="Previous instruction" disabled={currentStep === 0 && elapsed === 0} onclick={previous}><ChevronLeft /></button><button class="guided-play" onclick={running ? pause : start}>{#if running}<Pause /> Pause{:else}<Play /> Start{/if}</button><button aria-label="Next instruction" onclick={next}><ChevronRight /></button></div>
      <div class="guided-secondary"><button onclick={restart}><SkipBack /> Restart</button><button onclick={() => onReject(input)}>This step isn’t for me</button><button onclick={onCrisis}><ShieldAlert /> Emergency exit</button></div>
      <p class="guided-safety"><Square size={14} /> You can stop at any time. Fifteen seconds is enough to be offered feedback.</p>
      {#each practice.cautions as caution}<p class="guided-caution"><ShieldAlert /> {caution}</p>{/each}
    </main>
  </div>
{/if}
