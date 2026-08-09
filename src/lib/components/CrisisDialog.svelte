<script lang="ts">
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import HeartHandshake from '@lucide/svelte/icons/heart-handshake';
  import X from '@lucide/svelte/icons/x';
  import { focusTrap } from '$lib/focus';
  export let onClose: () => void;
  function keys(event: KeyboardEvent) { if (event.key === 'Escape') onClose(); }
</script>
<svelte:window onkeydown={keys} />
<div class="modal-backdrop crisis-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="crisis-title" use:focusTrap><div class="crisis-modal"><button class="icon-button" aria-label="Close safety support" onclick={onClose}><X /></button><div class="crisis-mark"><HeartHandshake /></div><span class="eyebrow coral">The app steps aside here</span><h1 id="crisis-title">You deserve real-time human support.</h1><p>If you may hurt yourself or someone else, or cannot stay safe, call your local emergency number now or go to the nearest emergency department.</p><div class="crisis-actions"><a href="tel:988" class="primary-button">Call or text 988 <ArrowRight /></a><a href="https://findahelpline.com/" target="_blank" rel="noreferrer" class="quiet-button">Find support outside the U.S. <ArrowRight /></a></div><small>In the U.S. and Canada, 988 connects you with trained crisis support. If calling is not safe, move toward another person or public place if you can.</small><button class="stay-button" onclick={onClose}>I can stay safe right now—return to Unspool</button></div></div>
