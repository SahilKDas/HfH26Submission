<script lang="ts">
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import Download from '@lucide/svelte/icons/download';
  import LoaderCircle from '@lucide/svelte/icons/loader-circle';
  import Play from '@lucide/svelte/icons/play';
  import { evaluateAuditCase, generateAuditCorpus, summarizeAuditResults, type AuditReport } from '$shared/audit';

  let running = false;
  let report: AuditReport | null = null;

  async function runAudit() {
    running = true; report = null;
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const corpus = generateAuditCorpus();
    report = summarizeAuditResults(corpus.map(evaluateAuditCase));
    running = false;
  }

  function download(value: AuditReport) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = `unspool-audit-${value.modelVersion}.json`; link.click(); URL.revokeObjectURL(link.href);
  }
</script>

<div class="audit-console">
  <div class="console-bar"><i></i><i></i><i></i><span>local / exact-constraint-audit</span></div>
  <div class="console-body">
    <div class="console-top"><span><b>Exact constraint audit</b><small>3,072 fixed synthetic cases · computed in this browser</small></span><button disabled={running} onclick={runAudit}>{#if running}<LoaderCircle class="spin" /> Running{:else}<Play /> Run local audit{/if}</button></div>
    {#if report}
      <div class="audit-report"><div class="audit-verdict"><CheckCircle2 /><span><b>{report.passed ? 'All fixed safety constraints passed' : 'Audit needs review'}</b><small>Fresh local report · no network request</small></span></div><div class="audit-metrics"><span><b>{report.scenarioCount}</b><small>scenarios</small></span><span><b>{report.unsafeSelections}</b><small>unsafe</small></span><span><b>{report.constraintViolations}</b><small>violations</small></span></div><div class="audit-meta"><span>{report.modelVersion}</span><span>seed {report.seed}</span><span>{new Date(report.generatedAt).toLocaleDateString()}</span></div><p>{report.limitations[0]}</p><button onclick={() => download(report as AuditReport)}><Download /> Download JSON</button></div>
    {:else}
      <div class="audit-result"><CheckCircle2 /><span><b>Ready to reproduce</b><small>The same local ranker used for recommendations evaluates every case.</small></span></div>
    {/if}
    <p class="console-note">Synthetic inputs stay in memory and are discarded when you leave. No server, account, telemetry, or cloud task is involved.</p>
  </div>
</div>
