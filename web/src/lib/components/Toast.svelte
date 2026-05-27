<script lang="ts">
  import { toast } from '$lib/toast';
</script>

{#if toast.items.length > 0}
  <div class="toast-stack" aria-live="polite" aria-atomic="false">
    {#each toast.items as t (t.id)}
      <div
        class="toast toast-{t.kind}"
        role={t.kind === 'error' ? 'alert' : 'status'}
      >
        <!-- Icon -->
        <span class="toast-icon" aria-hidden="true">
          {#if t.kind === 'success'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          {:else if t.kind === 'error'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          {/if}
        </span>

        <span class="toast-msg">{t.message}</span>

        <button
          class="toast-close"
          onclick={() => toast.remove(t.id)}
          aria-label="Dismiss"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-stack {
    position: fixed;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
    width: max-content;
    max-width: min(480px, calc(100vw - 32px));
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.4;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.14), 0 1px 4px rgba(0, 0, 0, 0.08);
    pointer-events: auto;
    animation: toast-in 220ms var(--ease-out, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
    width: 100%;
  }

  /* Variants */
  .toast-success {
    background: #1A3A1A;
    color: #C8F0C8;
    border: 1px solid rgba(200, 240, 200, 0.15);
  }
  .toast-error {
    background: #3A1A1A;
    color: #F0C8C8;
    border: 1px solid rgba(240, 200, 200, 0.15);
  }
  .toast-info {
    background: var(--charcoal-brown, #3D2E26);
    color: var(--floral-white, #FAF6EE);
    border: 1px solid rgba(250, 246, 238, 0.12);
  }

  .toast-icon { flex-shrink: 0; opacity: 0.9; }
  .toast-msg  { flex: 1; }

  .toast-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: inherit;
    opacity: 0.55;
    cursor: pointer;
    padding: 0;
    transition: opacity 120ms;
  }
  .toast-close:hover { opacity: 1; }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
</style>
