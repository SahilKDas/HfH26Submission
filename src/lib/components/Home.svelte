<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  export let onCheckIn: () => void;
  export let onCrisis: () => void;
  export let onMethod: () => void;
</script>

<main id="main-content">
  <section class="hero-shell">
    <div class="hero-art" aria-hidden="true"></div><div class="hero-vignette" aria-hidden="true"></div>
    <div class="hero-content">
      <span class="pill pill-warm"><Sparkles size={14} /> One safe next step</span>
      <h1>When everything is<br /><em>too much.</em></h1>
      <p class="hero-lede">Unspool turns a ten-second private check-in into one small, explainable practice. No account, no diagnosis, and no pressure to tell your whole story.</p>
      <div class="hero-actions">
        <button class="primary-button large" onclick={onCheckIn}>Find my next step <ArrowRight size={18} /></button>
        <button class="quiet-button large" onclick={onMethod}>See how it decides</button>
      </div>
      <div class="trust-row"><span><LockKeyhole size={14} /> Stays on this device</span><span><ShieldCheck size={14} /> Safety constraints first</span><span><WifiOff size={14} /> Core flow works offline</span></div>
    </div>
    <aside class="hero-now-card">
      <span class="eyebrow">Need urgent support?</span><div class="now-orbit"><span>988</span><small>US & Canada</small></div>
      <h2>You do not have to use the recommender.</h2><p>Reach crisis support in one action whenever immediate safety is uncertain.</p>
      <button onclick={onCrisis}>Open support options <ArrowRight size={15} /></button>
    </aside>
  </section>
  <div class="proof-strip"><span>Private by design</span><i></i><span>Eight bounded practices</span><i></i><span>Exact inspectable ranking</span></div>
  <section class="section-pad">
    <div class="section-heading split-heading"><div><span class="eyebrow coral">Less advice. More traction.</span><h2>A calmer path from signal to action.</h2></div><p>Unspool does not pretend to know what you feel. You choose the signals, constraints, and available time; the model shows why one practice fits.</p></div>
    <div class="feature-grid">
      <article class="feature-card feature-dark"><span class="feature-number">01 / NOTICE</span><div class="signal-cloud" aria-hidden="true"><span>racing</span><span>frozen</span><span>far away</span></div><h3>Name body signals</h3><p>Choose plain-language signals without writing or uploading a journal entry.</p></article>
      <article class="feature-card feature-coral"><span class="feature-number">02 / CONSTRAIN</span><div class="constraint-rings" aria-hidden="true"></div><h3>Respect what is accessible</h3><p>Time, breath, sound, eyes-open, and seated requirements are hard exclusions—not afterthoughts.</p></article>
      <article class="feature-card feature-paper"><span class="feature-number">03 / ACT</span><div class="step-preview" aria-hidden="true"><b>One step</b><span>45–180 seconds</span></div><h3>Try one bounded practice</h3><p>Optional guided mode, visible timing, and an exit that never disappears.</p></article>
    </div>
  </section>
</main>
