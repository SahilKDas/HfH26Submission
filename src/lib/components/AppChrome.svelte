<script lang="ts">
  import { onMount } from 'svelte';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import WifiOff from '@lucide/svelte/icons/wifi-off';
  import X from '@lucide/svelte/icons/x';
  import { isDemoMode } from '$lib/storage';
  export let onDemo: () => void;
  let offline = false; let dismissed = false; let updateReady = false; let registration: ServiceWorkerRegistration | null = null;
  onMount(() => {
    offline = !navigator.onLine; const online = () => { offline = false; dismissed = false; }; const offlineNow = () => { offline = true; dismissed = false; };
    addEventListener('online', online); addEventListener('offline', offlineNow);
    navigator.serviceWorker?.ready.then((value) => { registration = value; if (value.waiting) updateReady = true; value.addEventListener('updatefound', () => value.installing?.addEventListener('statechange', () => { if (value.waiting) updateReady = true; })); });
    return () => { removeEventListener('online', online); removeEventListener('offline', offlineNow); };
  });
  function refresh() { registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }); navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); }
</script>
{#if isDemoMode()}<aside class="demo-banner"><span><b>Demo Mode</b><small>Session and model state are isolated in memory.</small></span><div><button onclick={onDemo}>Load judging flow</button><button onclick={() => location.href = location.pathname}>Exit demo</button></div></aside>{/if}
{#if offline && !dismissed}<aside class="offline-banner" role="status"><WifiOff /><span><b>You are offline.</b> Check-ins, saved local insights, and the local audit still work. Only the optional lofi stream needs a connection.</span><button aria-label="Dismiss offline notice" onclick={() => dismissed = true}><X /></button></aside>{/if}
{#if updateReady}<aside class="pwa-update" role="status"><RotateCcw /><span><b>An Unspool update is ready.</b><small>Refresh when ready; local data stays on this device.</small></span><button onclick={refresh}>Refresh</button><button class="pwa-dismiss" aria-label="Dismiss update notice" onclick={() => updateReady = false}><X /></button></aside>{/if}
