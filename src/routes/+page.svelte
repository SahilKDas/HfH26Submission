<script lang="ts">
  import Header from '$lib/components/Header.svelte'; import Home from '$lib/components/Home.svelte'; import CheckInDialog from '$lib/components/CheckInDialog.svelte'; import PlanView from '$lib/components/PlanView.svelte'; import CrisisDialog from '$lib/components/CrisisDialog.svelte'; import Insights from '$lib/components/Insights.svelte'; import Method from '$lib/components/Method.svelte'; import RadioPlayer from '$lib/components/RadioPlayer.svelte'; import Footer from '$lib/components/Footer.svelte'; import AppChrome from '$lib/components/AppChrome.svelte';
  import { pauseRadio } from '$lib/audio'; import { practiceById, type Practice } from '$lib/data'; import { isDemoMode, loadOutcomes } from '$lib/storage';
  import { ensureLearningConsent, requestRecommendation, type AdaptiveCandidate } from '$lib/api';
  import { rankModel, type CheckInInput, type RankedPractice } from '$shared/ranker';
  type View = 'home' | 'method' | 'insights'; type Recommendation = Practice & RankedPractice;
  interface DecisionMeta { decisionId: string | null; modelVersion: string; policySource: 'adaptive-v3' | 'offline-v2'; decisionMargin: number; decisionClarity: 'close' | 'clear'; learningEnabled: boolean; }
  let view: View = 'home'; let checkingIn = false; let crisis = false; let draft: CheckInInput | null = null; let plan: { practice: Recommendation; input: CheckInInput; meta: DecisionMeta } | null = null; let revision = 0;
  const demoInput: CheckInInput = { signals: ['overstimulated', 'racing'], need: 'quiet', intensity: 8, capacity: 90, preferences: { noBreath: true, eyesOpen: true, silent: true, seated: true }, immediateDanger: false };
  function navigate(next: View) { view = next; requestAnimationFrame(() => scrollTo({ top: 0, behavior: 'smooth' })); }
  function openCheckIn() { plan = null; draft = null; checkingIn = true; }
  function loadDemo() { plan = null; draft = structuredClone(demoInput); checkingIn = true; }
  function openCrisis() { checkingIn = false; crisis = true; pauseRadio(); }
  function restart(input: CheckInInput) { plan = null; draft = structuredClone(input); checkingIn = true; }
  async function receive(input: CheckInInput, learningConsent: boolean) {
    if (!isDemoMode()) {
      try {
        if (learningConsent) await ensureLearningConsent();
        const response = await requestRecommendation(input);
        if (!response.selected) { if (response.gate.level === 'urgent') openCrisis(); return; }
        const content = practiceById.get(response.selected.id); if (!content) throw new Error(`Missing practice content for ${response.selected.id}`);
        plan = { practice: { ...content, ...(response.selected as AdaptiveCandidate) }, input, meta: { decisionId: response.decisionId, modelVersion: response.modelVersion, policySource: 'adaptive-v3', decisionMargin: response.decisionMargin, decisionClarity: response.decisionClarity, learningEnabled: response.learningEnabled } };
        checkingIn = false; requestAnimationFrame(() => scrollTo(0, 0)); return;
      } catch { /* The deterministic policy is the explicit resilience path. */ }
    }
    const result = rankModel(input, loadOutcomes()); const winner = result.ranked[0];
    if (!winner) { if (result.gate.level === 'urgent') openCrisis(); return; }
    const content = practiceById.get(winner.id); if (!content) throw new Error(`Missing practice content for ${winner.id}`);
    const runnerUp = result.ranked[1]; const margin = runnerUp ? winner.score - runnerUp.score : 0;
    plan = { practice: { ...content, ...winner }, input, meta: { decisionId: null, modelVersion: result.modelVersion, policySource: 'offline-v2', decisionMargin: margin, decisionClarity: margin >= .75 ? 'clear' : 'close', learningEnabled: false } }; checkingIn = false; requestAnimationFrame(() => scrollTo(0, 0));
  }
  function closePlan() { plan = null; view = 'home'; }
</script>

<svelte:head><title>Unspool — one safe next step</title></svelte:head>
<div class="app" class:demo-mode={isDemoMode()}>
  <a class="skip-link" href="#main-content">Skip to main content</a><AppChrome onDemo={loadDemo} />
  {#if plan}<PlanView practice={plan.practice} input={plan.input} meta={plan.meta} onClose={closePlan} onAgain={openCheckIn} onReject={restart} onCrisis={openCrisis} onSaved={() => revision += 1} />
  {:else}<Header {view} onNavigate={navigate} onCheckIn={openCheckIn} />{#if view === 'home'}<Home onCheckIn={openCheckIn} onCrisis={openCrisis} onMethod={() => navigate('method')} />{:else if view === 'method'}<Method onCheckIn={openCheckIn} />{:else}<Insights {revision} onCheckIn={openCheckIn} />{/if}<Footer onNavigate={navigate} onCheckIn={openCheckIn} />{/if}
  {#if checkingIn}<CheckInDialog initial={draft} onClose={() => checkingIn = false} onComplete={receive} onCrisis={openCrisis} />{/if}
  {#if crisis}<CrisisDialog onClose={() => crisis = false} />{:else}<RadioPlayer />{/if}
</div>
