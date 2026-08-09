<script lang="ts">
  import { onMount } from 'svelte';
  import '@fontsource/dm-sans/latin-400.css';
  import '@fontsource/dm-sans/latin-500.css';
  import '@fontsource/dm-sans/latin-600.css';
  import '@fontsource/dm-sans/latin-700.css';
  import '@fontsource/manrope/latin-400.css';
  import '@fontsource/manrope/latin-500.css';
  import '@fontsource/manrope/latin-600.css';
  import '@fontsource/manrope/latin-700.css';
  import '../styles.css';
  import { initAudio } from '$lib/audio';
  let { children } = $props();
  onMount(initAudio);
</script>

{@render children()}
