<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>{$page.status} · SoundBaze</title>
</svelte:head>

<div class="error-shell">
  <!-- Adinkra watermark — Sankofa (learn from the past) -->
  <div class="error-adinkra" aria-hidden="true">
    <svg viewBox="0 0 200 200" width="240" height="240" opacity="0.06">
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="4"/>
      <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="6 8"/>
      <circle cx="100" cy="100" r="28" fill="none" stroke="currentColor" stroke-width="3"/>
      <circle cx="100" cy="100" r="8" fill="currentColor"/>
      <path d="M100 20 L100 100 M100 100 L160 60 M100 100 L40 60" stroke="currentColor" stroke-width="3" fill="none"/>
    </svg>
  </div>

  <div class="error-content">
    <div class="error-code">{$page.status}</div>

    {#if $page.status === 404}
      <h1 class="error-title">Eish — nothing here.</h1>
      <p class="error-body">
        This page doesn't exist, charley. The song, artist, or annotation you're looking for may have moved.
      </p>
    {:else if $page.status === 401}
      <h1 class="error-title">Sign in first.</h1>
      <p class="error-body">You need to be signed in to do that.</p>
    {:else if $page.status === 403}
      <h1 class="error-title">Not your lane.</h1>
      <p class="error-body">You don't have permission to access this page.</p>
    {:else if $page.status === 429}
      <h1 class="error-title">Slow down, charley.</h1>
      <p class="error-body">Too many requests. Give it a moment and try again.</p>
    {:else}
      <h1 class="error-title">Something went wrong.</h1>
      <p class="error-body">
        {$page.error?.message ?? 'We\'ve been notified. Try refreshing — if it keeps happening, come back later.'}
      </p>
    {/if}

    <div class="error-actions">
      {#if $page.status === 401}
        <a href="/login" class="btn btn-primary">Sign in</a>
      {/if}
      <a href="/" class="btn btn-ghost">Back to home</a>
      {#if $page.status >= 500}
        <button class="btn btn-ghost" onclick={() => window.location.reload()}>Try again</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .error-shell {
    min-height: 70vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding: 60px 24px;
  }

  .error-adinkra {
    position: absolute;
    right: 10%;
    top: 50%;
    transform: translateY(-50%);
    color: var(--fg);
    pointer-events: none;
  }

  .error-content {
    text-align: center;
    max-width: 440px;
    position: relative;
    z-index: 1;
  }

  .error-code {
    font-size: 96px;
    font-weight: 800;
    letter-spacing: -0.05em;
    line-height: 1;
    color: var(--accent);
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--fg);
    margin-bottom: 12px;
  }

  .error-body {
    font-size: 16px;
    color: var(--fg-muted);
    line-height: 1.6;
    margin-bottom: 32px;
  }

  .error-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
