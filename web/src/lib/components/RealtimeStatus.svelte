<script lang="ts">
  interface Props {
    /** 'connecting' | 'live' | 'error' | 'idle' */
    status: string;
  }
  let { status }: Props = $props();
</script>

{#if status === 'error'}
  <div class="rt-banner" role="alert" aria-live="polite">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    Live updates unavailable
    <button onclick={() => location.reload()}>Refresh</button>
  </div>
{/if}
