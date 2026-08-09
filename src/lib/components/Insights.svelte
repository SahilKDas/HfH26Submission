<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Check from '@lucide/svelte/icons/check';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { clearPrivateData, loadSessions, type Session } from '$lib/storage';
  export let revision = 0; export let onCheckIn: () => void;
  let confirmClear = false; let sessions: Session[] = loadSessions(); $: sessions = (revision, loadSessions());
  $: rated = sessions.filter((session) => session.outcome); $: helpful = rated.filter((session) => session.outcome === 'helped').length;
  $: harder = rated.filter((session) => session.outcome === 'harder').length; $: completed = sessions.filter((session) => session.completed).length;
  $: stopped = sessions.filter((session) => !session.completed).length; $: rate = rated.length ? Math.round(helpful / rated.length * 100) : 0;
  $: points = sessions.filter((session) => Number.isFinite(session.after)).slice(0, 7).reverse();
  $: chartPoints = points.map((session, index) => `${20 + index * 55},${130 - Number(session.after) / 10 * 95}`).join(' ');
  function clear() { clearPrivateData(); sessions = []; confirmClear = false; }
</script>

<main id="main-content" class="insights-page page-shell"><div class="page-kicker"><span class="pill pill-sage"><LockKeyhole /> Only visible on this device</span></div>
  <div class="insights-heading"><div><span class="eyebrow coral">Your private pattern</span><h1>Small signals.<br /><em>Useful memory.</em></h1></div><p>Unspool remembers explicit bounded outcomes, not stories. No journal text, diagnosis, or identity is collected.</p></div>
  <section class="stats-grid"><article><span>Check-ins</span><strong>{sessions.length || '—'}</strong><small>{sessions.length ? `${completed} completed · ${stopped} stopped` : 'Your first explicit session starts the pattern'}</small></article><article><span>Helpful steps</span><strong>{rated.length ? `${rate}%` : '—'}</strong><small>{harder ? `${harder} marked harder and excluded` : 'Based only on explicit feedback'}</small></article><article class="accent"><span>Raw check-in uploaded</span><strong>0 <small>bytes</small></strong><small>Radio playback never receives check-in data</small></article></section>
  <div class="insights-grid"><section class="pattern-card"><div class="card-heading"><div><span class="eyebrow">Explicit measurements</span><h2>Intensity you reported afterward</h2></div><span class="pill">{points.length ? 'Your data' : 'Waiting for data'}</span></div>
    {#if points.length}<div class="line-chart"><div class="y-labels"><span>10</span><span>5</span><span>0</span></div><svg viewBox="0 0 380 150" role="img" aria-label="Recent explicitly reported after-intensity scores"><line x1="20" y1="35" x2="360" y2="35"></line><line x1="20" y1="82" x2="360" y2="82"></line><line x1="20" y1="130" x2="360" y2="130"></line><polyline points={chartPoints}></polyline>{#each points as session, index}<circle cx={20 + index * 55} cy={130 - Number(session.after) / 10 * 95} r="5"><title>{session.completed ? 'Completed' : 'Stopped'} · {session.outcome ?? 'feedback skipped'} · intensity {session.after}</title></circle>{/each}</svg></div><div class="session-legend">{#each points as session}<span class={`outcome-${session.outcome ?? 'none'}`}>{session.completed ? 'Completed' : 'Stopped'} · {session.outcome ?? 'measurement only'}</span>{/each}</div>
    {:else}<div class="empty-pattern"><div><i></i><i></i><i></i></div><h3>No story to perform here.</h3><p>Complete a practice and optionally report one explicit measurement.</p><button onclick={onCheckIn}>Try a check-in <ArrowRight /></button></div>{/if}
  </section><section class="model-card"><span class="eyebrow">What the model knows</span><h2>A deliberately tiny memory.</h2><div class="knows-row"><Check /><span><b>Practice ID</b><small>Which bounded step was tried</small></span></div><div class="knows-row"><Check /><span><b>Explicit outcome</b><small>Helped / same / harder, only when supplied</small></span></div><div class="knows-row"><Check /><span><b>Optional after-intensity</b><small>Never inferred from an outcome</small></span></div><div class="knows-row muted"><X /><span><b>No raw check-in</b><small>Signals and needs are discarded</small></span></div><button class="delete-button" onclick={() => confirmClear = true}><Trash2 /> Erase my private model</button>{#if confirmClear}<div class="confirm-clear"><p>This removes local outcomes and sessions from this browser.</p><div><button onclick={clear}>Erase it</button><button onclick={() => confirmClear = false}>Cancel</button></div></div>{/if}</section></div>
</main>
