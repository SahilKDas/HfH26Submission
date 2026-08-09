<script lang="ts">
  import Menu from '@lucide/svelte/icons/menu';
  import X from '@lucide/svelte/icons/x';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  export let view: 'home' | 'method' | 'insights';
  export let onNavigate: (view: 'home' | 'method' | 'insights') => void;
  export let onCheckIn: () => void;
  let open = false;
  function navigate(next: typeof view) { open = false; onNavigate(next); }
</script>

<header class="site-header">
  <div class="header-inner">
    <button class="brand" aria-label="Unspool home" onclick={() => navigate('home')}>
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>Unspool
    </button>
    <button class="menu-button" aria-label="Toggle navigation" aria-expanded={open} onclick={() => open = !open}>{#if open}<X />{:else}<Menu />{/if}</button>
    <nav aria-label="Main navigation" class={open ? 'nav-open' : ''}>
      <button class:active={view === 'home'} onclick={() => navigate('home')}>Home</button>
      <button class:active={view === 'method'} onclick={() => navigate('method')}>How it works</button>
      <button class:active={view === 'insights'} onclick={() => navigate('insights')}>My pattern</button>
      <button class="nav-checkin" onclick={() => { open = false; onCheckIn(); }}><Sparkles size={16} /> Check in</button>
    </nav>
  </div>
</header>
