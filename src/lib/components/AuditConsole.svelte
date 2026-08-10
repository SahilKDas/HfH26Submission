<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Download from '@lucide/svelte/icons/download';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Play from '@lucide/svelte/icons/play';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Server from '@lucide/svelte/icons/server';
  import { getJob, getModelRoomStatus, startSimulation, type JobStatus, type ModelRoomStatus, type SimulationReport } from '$lib/api';

  let status: ModelRoomStatus | null = null; let job: JobStatus | null = null; let report: SimulationReport | null = null;
  let running = false; let unavailable = false; let disposed = false;
  onMount(() => { void loadStatus(); }); onDestroy(() => { disposed = true; });

  async function loadStatus() { try { status = await getModelRoomStatus(); unavailable = false; } catch { unavailable = true; } }
  async function runSimulation() {
    running = true; unavailable = false; report = null;
    try {
      job = await startSimulation();
      for (let attempt = 0; attempt < 45 && !disposed; attempt += 1) {
        if (job.status === 'completed') { report = job.report ?? null; running = false; await loadStatus(); return; }
        if (job.status === 'failed') throw new Error(job.message ?? 'Simulation failed');
        await new Promise((resolve) => window.setTimeout(resolve, Math.min(3_000, 500 + attempt * 150)));
        job = await getJob(job.jobId);
      }
      throw new Error('The worker did not finish within 90 seconds.');
    } catch { running = false; unavailable = true; }
  }
  function download(value: SimulationReport) { const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `unspool-model-room-${value.modelVersion}.json`; link.click(); URL.revokeObjectURL(link.href); }
</script>

<div class="audit-console">
  <div class="console-bar"><i></i><i></i><i></i><span>django / model-room / postgres-worker</span></div>
  <div class="console-body">
    <div class="console-top"><span><b>Live adaptive model room</b><small>{status ? `${status.activeModel} · ${status.featureCount} features · ${status.retainedOutcomeCount}/${status.minimumForChallenger} retained outcomes` : 'Loading active model lifecycle…'}</small></span><button disabled={running} onclick={runSimulation}>{#if running}<LoaderCircle class="spin" /> {job?.status ?? 'queueing'} {job?.progress ?? 0}%{:else}<Play /> Run live simulation{/if}</button></div>
    {#if report}
      <div class="audit-report"><div class="audit-verdict"><CheckCircle2 /><span><b>{report.passed ? 'Challenger cleared every hard gate' : 'Challenger was blocked'}</b><small>Fresh isolated backend run · never eligible for production promotion</small></span></div><div class="audit-metrics"><span><b>{report.trainingInteractions}</b><small>training interactions</small></span><span><b>{report.evaluationScenarios}</b><small>held-out cases</small></span><span><b>{report.constraintViolations}</b><small>violations</small></span></div><div class="audit-meta"><span>{report.modelVersion}</span><span>seed {report.seed}</span><span>{report.featureCount} features</span><span>{report.practiceCoverage}/8 practices</span></div><div class="simulation-compare"><span><small>Baseline reward</small><b>{report.baselineReward.toFixed(3)}</b></span><span><small>Challenger reward</small><b>{report.challengerReward.toFixed(3)}</b></span><span><small>Simulated change</small><b>{report.simulatedImprovement >= 0 ? '+' : ''}{report.simulatedImprovement.toFixed(3)}</b></span></div><p>{report.limitations[0]}</p><button onclick={() => download(report as SimulationReport)}><Download /> Download JSON report</button></div>
    {:else if unavailable}
      <div class="audit-error"><Server /><span><b>Model worker unavailable</b><small>The normal check-in will use the labeled offline-v2 fallback. Start Django and the worker, then retry.</small></span><button onclick={() => { void loadStatus(); void runSimulation(); }}><RotateCcw /> Retry</button></div>
    {:else}
      <div class="audit-result"><Server /><span><b>{status ? `${status.promotionState} policy ready` : 'Connecting to Django'}</b><small>Training, evaluation, and model promotion are durable backend lifecycle operations.</small></span></div>
    {/if}
    <p class="console-note">The live simulator trains on 12,288 generated interactions and evaluates 3,072 held-out scenarios. It demonstrates learning-system behavior, not clinical effectiveness, and cannot modify the active production policy.</p>
  </div>
</div>
