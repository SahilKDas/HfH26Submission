<script lang="ts">
  import Activity from '@lucide/svelte/icons/activity';
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import Brain from '@lucide/svelte/icons/brain';
  import Check from '@lucide/svelte/icons/check';
  import Database from '@lucide/svelte/icons/database';
  import Eye from '@lucide/svelte/icons/eye';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
  import Scan from '@lucide/svelte/icons/scan';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import X from '@lucide/svelte/icons/x';
  import ConstraintLab from './ConstraintLab.svelte'; import EvidenceLedger from './EvidenceLedger.svelte'; import AuditConsole from './AuditConsole.svelte';
  export let onCheckIn: () => void;
  const stages = [
    { n: '01', icon: ShieldCheck, title: 'Safety gate', body: 'Urgent danger bypasses recommendation. Inputs are bounded before the model runs.' },
    { n: '02', icon: Scan, title: 'Hybrid retrieval', body: 'Structured overlap and a compact local embedding retrieve from eight curated practices.' },
    { n: '03', icon: Sparkles, title: 'Contextual ranking', body: 'Signal, need, duration, intensity, semantic fit, and reversible local learning compose the score.' },
    { n: '04', icon: Check, title: 'Constraint verification', body: 'Time, breath, eye state, silence, position, intensity, and harder feedback are hard exclusions.' },
    { n: '05', icon: Eye, title: 'Explanation layer', body: 'Every result exposes score parts and exclusion reasons without presenting a health conclusion.' },
  ];
</script>
<main id="main-content" class="method-page page-shell"><section class="method-hero"><div><span class="pill pill-warm"><Brain /> AI that knows its place</span><h1>Useful intelligence.<br /><em>Radical restraint.</em></h1><p>Unspool uses a deterministic, inspectable model to reduce decision load—not to impersonate a clinician, diagnose distress, or retain a transcript.</p><button class="primary-button" onclick={onCheckIn}>See it in action <ArrowRight /></button></div><div class="method-visual" aria-hidden="true"><div class="method-core"><Brain /></div><span class="ring r1"></span><span class="ring r2"></span><span class="ring r3"></span><small class="orbit-label l1">bounded</small><small class="orbit-label l2">local</small><small class="orbit-label l3">explainable</small></div></section>
  <section class="pipeline-section"><div class="section-heading"><span class="eyebrow coral">Five stages, zero black box</span><h2>Every recommendation earns its way onto the screen.</h2></div><div class="pipeline-grid">{#each stages as stage}<article><div><span>{stage.n}</span><svelte:component this={stage.icon} /></div><h3>{stage.title}</h3><p>{stage.body}</p></article>{/each}</div></section>
  <ConstraintLab />
  <section class="responsibility-section"><div class="responsibility-copy"><span class="eyebrow">Responsible by architecture</span><h2>The safest health record is the one we never create.</h2><p>Raw check-ins are processed in-browser and discarded. Only a practice ID, explicit bounded outcome, completion state, and optional reported after-intensity can persist locally.</p></div><div class="data-diagram"><div class="diagram-row positive"><span><Check /></span><div><b>On your device</b><small>Signals · intensity · access needs · outcome</small></div><span class="pill pill-sage">browser local</span></div><div class="diagram-divider"><LockKeyhole /><i></i></div><div class="diagram-row"><span><Database /></span><div><b>Local synthetic audit</b><small>Fixed generated cases · exact model · memory only</small></div><span class="pill">no network</span></div><div class="diagram-row blocked"><span><X /></span><div><b>Never collected</b><small>Names · diagnoses · free text · location</small></div></div></div></section>
  <section class="audit-proof"><div class="audit-copy"><span class="pill pill-sage"><RefreshCcw /> Reproducible locally</span><h2>Constraint checks should be executable, not promises.</h2><p>The browser runs the exact model across 3,072 fixed synthetic scenarios and produces a downloadable report. It tests access constraints—not clinical efficacy or demographic fairness.</p></div><AuditConsole /></section>
  <EvidenceLedger />
  <section class="guardrail-grid"><article><ShieldCheck /><h3>Clinical boundary</h3><p>Brief self-regulation options, never treatment plans.</p></article><article><Eye /><h3>Explainability</h3><p>Inspect every score factor and exclusion.</p></article><article><Activity /><h3>Access parity</h3><p>Automated tests cover every supported access mode.</p></article><article><RefreshCcw /><h3>Reversible learning</h3><p>Private outcomes can be erased at any time.</p></article></section>
</main>
