<script lang="ts">
  import Activity from '@lucide/svelte/icons/activity';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Brain from '@lucide/svelte/icons/brain';
  import Check from '@lucide/svelte/icons/check';
  import Database from '@lucide/svelte/icons/database';
  import Eye from '@lucide/svelte/icons/eye';
  import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
  import Scan from '@lucide/svelte/icons/scan';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import ConstraintLab from './ConstraintLab.svelte'; import EvidenceLedger from './EvidenceLedger.svelte'; import AuditConsole from './AuditConsole.svelte';
  export let onCheckIn: () => void;
  const stages = [
    { n: '01', icon: ShieldCheck, title: 'Safety eligibility', body: 'Danger bypass, bounded validation, and access exclusions decide what the model is allowed to consider.' },
    { n: '02', icon: Scan, title: 'Evidence prior', body: 'Structured overlap plus feature-hashed retrieval creates an inspectable baseline for every eligible practice.' },
    { n: '03', icon: Brain, title: 'Contextual bandit', body: 'A 25-feature LinUCB policy estimates response and uncertainty without overriding a single hard constraint.' },
    { n: '04', icon: RefreshCcw, title: 'Explicit update', body: 'Helped, same, or harder updates only the selected arm; after-intensity is measured but never converted into a reward.' },
    { n: '05', icon: Check, title: 'Promotion gate', body: 'New global challengers must pass reproducible safety, coverage, and regression evaluation before manual promotion.' },
  ];
</script>
<main id="main-content" class="method-page page-shell"><section class="method-hero"><div><span class="pill pill-warm"><Brain /> Closed-loop adaptive support</span><h1>Useful intelligence.<br /><em>Hard brakes.</em></h1><p>Unspool connects signal, decision, action, and explicit outcome. It learns which eligible practice fits better without turning a difficult moment into a chatbot conversation.</p><button class="primary-button" onclick={onCheckIn}>Run the adaptive loop <ArrowRight /></button></div><div class="method-visual" aria-hidden="true"><div class="method-core"><Brain /></div><span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span><small class="orbit-label l1">signal</small><small class="orbit-label l2">outcome</small><small class="orbit-label l3">adapt</small></div></section>
  <section class="pipeline-section"><div class="section-heading"><span class="eyebrow coral">Five stages, one model lifecycle</span><h2>Every decision becomes a testable loop.</h2></div><div class="pipeline-grid">{#each stages as stage}<article><div><span>{stage.n}</span><svelte:component this={stage.icon} /></div><h3>{stage.title}</h3><p>{stage.body}</p></article>{/each}</div></section>
  <ConstraintLab />
  <section class="responsibility-section"><div class="responsibility-copy"><span class="eyebrow">Signal → decision → outcome → learning</span><h2>The backend has a real job.</h2><p>Django owns anonymous consent, live inference, durable decisions, idempotent outcomes, personal policy updates, candidate training, evaluation jobs, and guarded model promotion.</p></div><div class="data-diagram"><div class="diagram-row positive"><span><Sparkles /></span><div><b>Live recommendation</b><small>Hard gate · evidence prior · LinUCB re-ranking</small></div><span class="pill pill-sage">adaptive-v3</span></div><div class="diagram-divider"><RefreshCcw /><i></i></div><div class="diagram-row"><span><Database /></span><div><b>Explicit learning event</b><small>Bounded context · selected arm · chosen outcome</small></div><span class="pill">30 days</span></div><div class="diagram-row"><span><ShieldCheck /></span><div><b>Candidate promotion</b><small>Postgres worker · safety audit · manual approval</small></div><span class="pill">fail closed</span></div></div></section>
  <section class="audit-proof"><div class="audit-copy"><span class="pill pill-sage"><Activity /> Live backend proof</span><h2>Open the Model Room.</h2><p>Queue a disposable challenger through the real Django/PostgreSQL worker, train on 12,288 seeded synthetic interactions, and evaluate 3,072 held-out scenarios. Synthetic results never touch production and never imply clinical efficacy.</p></div><AuditConsole /></section>
  <EvidenceLedger />
  <section class="guardrail-grid"><article><ShieldCheck /><h3>Safety before ML</h3><p>Learning can reorder eligible practices, never restore an excluded one.</p></article><article><Eye /><h3>Decision trace</h3><p>Inspect model version, margin, score parts, and exclusions.</p></article><article><Activity /><h3>Measured adaptation</h3><p>Only helped, same, or harder changes the selected arm.</p></article><article><Database /><h3>Durable lifecycle</h3><p>PostgreSQL records jobs, policies, evaluations, and promotions.</p></article></section>
</main>
