<script lang="ts">
  import Beaker from '@lucide/svelte/icons/beaker';
  import Check from '@lucide/svelte/icons/check';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Cpu from '@lucide/svelte/icons/cpu';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import X from '@lucide/svelte/icons/x';
  import { MODEL_VERSION, type AccessKey, type Capacity, type NeedId, type Preferences, type SignalId } from '$shared/model';
  import { rankModel, type CheckInInput, type RankResult } from '$shared/ranker';
  import { signalOptions, needOptions, practiceById } from '$lib/data';
  const judging: CheckInInput = { signals: ['overstimulated', 'racing'], need: 'quiet', intensity: 8, capacity: 90, preferences: { noBreath: true, eyesOpen: true, silent: true, seated: true }, immediateDanger: false };
  let signals: SignalId[] = ['racing']; let need: NeedId = 'grounding'; let intensity = 6; let capacity: Capacity = 90;
  let preferences: Preferences = { noBreath: false, eyesOpen: true, silent: false, seated: false };
  let previousWinner = '';
  $: input = { signals, need, intensity, capacity, preferences, immediateDanger: false } satisfies CheckInInput;
  $: result = rankModel(input) as RankResult;
  $: winner = result.ranked[0]?.id ?? 'No eligible practice';
  $: changeMessage = previousWinner && previousWinner !== winner ? `The top result changed from ${practiceById.get(previousWinner)?.name ?? previousWinner} to ${practiceById.get(winner)?.name ?? winner}.` : 'Change one constraint to see the ranking respond.';
  function beforeChange() { previousWinner = winner; }
  function toggleSignal(id: SignalId) { beforeChange(); signals = signals.includes(id) ? signals.filter((value) => value !== id) : [...signals, id]; if (!signals.length) signals = [id]; }
  function togglePreference(key: AccessKey, checked: boolean) { beforeChange(); preferences = { ...preferences, [key]: checked }; }
  function loadJudging() { previousWinner = winner; signals = [...judging.signals]; need = judging.need; intensity = judging.intensity; capacity = judging.capacity; preferences = { ...judging.preferences }; }
  const labels: Record<AccessKey, string> = { noBreath: 'No breath focus', eyesOpen: 'Eyes open', silent: 'Silent', seated: 'Seated' };
</script>

<details class="constraint-lab">
  <summary><span><Beaker /><b>Open the Constraint Lab</b><small>A synthetic, local-only sandbox that makes the ranker show its work.</small></span><ChevronDown /></summary>
  <div class="lab-body"><div class="lab-heading"><div><span class="eyebrow coral">Synthetic model sandbox</span><h2>Make the model show its work.</h2><p>These values are never sent, stored as a check-in, or used to update the private model.</p></div><div class="lab-version"><Cpu /><span><b>{MODEL_VERSION}</b><small>Exact production ranker</small></span></div></div>
    <div class="lab-grid"><form class="lab-controls" onsubmit={(event) => event.preventDefault()}>
      <fieldset><legend>Signals</legend><div class="lab-chip-grid">{#each signalOptions as option}<button type="button" class:selected={signals.includes(option.id)} aria-pressed={signals.includes(option.id)} onclick={() => toggleSignal(option.id)}>{#if signals.includes(option.id)}<Check />{/if}{option.label}</button>{/each}</div></fieldset>
      <div class="lab-control-grid"><label>Need<select bind:value={need} onchange={beforeChange}>{#each needOptions as option}<option value={option.id}>{option.label}</option>{/each}</select></label><label>Time<select bind:value={capacity} onchange={beforeChange}><option value={45}>45 sec</option><option value={90}>90 sec</option><option value={180}>3 min</option></select></label></div>
      <label class="lab-range">Intensity: {intensity}<input type="range" min="1" max="10" bind:value={intensity} oninput={beforeChange} /></label>
      <fieldset><legend>Access requirements</legend><div class="lab-toggles">{#each Object.entries(labels) as [key, label]}<label><input type="checkbox" checked={preferences[key as AccessKey]} onchange={(event) => togglePreference(key as AccessKey, event.currentTarget.checked)} />{label}</label>{/each}</div></fieldset>
      <button type="button" class="lab-reset" onclick={loadJudging}><RotateCcw /> Load judging scenario</button>
    </form><section class="lab-results" aria-live="polite"><div class="lab-change"><small>Constraint response</small><span>{changeMessage}</span></div><h3>Eligible ranking</h3>
      {#each result.ranked as candidate, index}<article class:winner={index === 0}><div><span>{index + 1}</span><b>{practiceById.get(candidate.id)?.name ?? candidate.id}</b><strong>{candidate.score.toFixed(2)}</strong></div><div class="score-bar"><i style={`width:${Math.min(100, candidate.score / 8 * 100)}%`}></i></div><small>signal {candidate.explanation.components.signal} · need {candidate.explanation.components.need} · access {candidate.explanation.preferenceFit ? 'fit' : 'neutral'} · learning {candidate.explanation.components.learning}</small></article>{/each}
      <h3>Excluded before ranking</h3><div class="excluded-list">{#each result.candidates.filter((candidate) => !candidate.eligible) as candidate}<span><X /> <b>{practiceById.get(candidate.id)?.name}</b> — {candidate.exclusions.join(', ')}</span>{/each}</div>
    </section></div>
  </div>
</details>
