<script lang="ts">
  import Header from '$lib/components/Header.svelte'; import Home from '$lib/components/Home.svelte'; import CheckInDialog from '$lib/components/CheckInDialog.svelte'; import PlanView from '$lib/components/PlanView.svelte'; import CrisisDialog from '$lib/components/CrisisDialog.svelte'; import Insights from '$lib/components/Insights.svelte'; import Method from '$lib/components/Method.svelte'; import RadioPlayer from '$lib/components/RadioPlayer.svelte'; import Footer from '$lib/components/Footer.svelte'; import AppChrome from '$lib/components/AppChrome.svelte';
  import { pauseRadio } from '$lib/audio'; import { practiceById, type Practice } from '$lib/data'; import { isDemoMode, loadOutcomes } from '$lib/storage';
  import { rankModel, type CheckInInput, type RankedPractice } from '$shared/ranker';
  type View = 'home' | 'method' | 'insights'; type Recommendation = Practice & RankedPractice;
  let view: View = 'home'; let checkingIn = false; let crisis = false; let draft: CheckInInput | null = null; let plan: { practice: Recommendation; input: CheckInInput } | null = null; let revision = 0;
  const demoInput: CheckInInput = { signals: ['overstimulated', 'racing'], need: 'quiet', intensity: 8, capacity: 90, preferences: { noBreath: true, eyesOpen: true, silent: true, seated: true }, immediateDanger: false };
  function navigate(next: View) { view = next; requestAnimationFrame(() => scrollTo({ top: 0, behavior: 'smooth' })); }
  function openCheckIn() { plan = null; draft = null; checkingIn = true; }
  function loadDemo() { plan = null; draft = structuredClone(demoInput); checkingIn = true; }
  function openCrisis() { checkingIn = false; crisis = true; pauseRadio(); }
  function restart(input: CheckInInput) { plan = null; draft = structuredClone(input); checkingIn = true; }
  function receive(input: CheckInInput) {
    const result = rankModel(input, loadOutcomes()); const winner = result.ranked[0];
    if (!winner) { if (result.gate.level === 'urgent') openCrisis(); return; }
    const content = practiceById.get(winner.id); if (!content) throw new Error(`Missing practice content for ${winner.id}`);
    plan = { practice: { ...content, ...winner }, input }; checkingIn = false; requestAnimationFrame(() => scrollTo(0, 0));
  }
  function closePlan() { plan = null; view = 'home'; }
</script>

<svelte:head><title>Unspool — one safe next step</title></svelte:head>
<div class="app" class:demo-mode={isDemoMode()}>
  <a class="skip-link" href="#main-content">Skip to main content</a><AppChrome onDemo={loadDemo} />
  {#if plan}<PlanView practice={plan.practice} input={plan.input} onClose={closePlan} onAgain={openCheckIn} onReject={restart} onCrisis={openCrisis} onSaved={() => revision += 1} />
  {:else}<Header {view} onNavigate={navigate} onCheckIn={openCheckIn} />{#if view === 'home'}<Home onCheckIn={openCheckIn} onCrisis={openCrisis} onMethod={() => navigate('method')} />{:else if view === 'method'}<Method onCheckIn={openCheckIn} />{:else}<Insights {revision} onCheckIn={openCheckIn} />{/if}<Footer onNavigate={navigate} onCheckIn={openCheckIn} />{/if}
  {#if checkingIn}<CheckInDialog initial={draft} onClose={() => checkingIn = false} onComplete={receive} onCrisis={openCrisis} />{/if}
  {#if crisis}<CrisisDialog onClose={() => crisis = false} />{:else}<RadioPlayer />{/if}
</div>
