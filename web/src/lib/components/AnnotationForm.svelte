<script lang="ts">
  interface Props {
    selection:   { start: number; end: number; text: string };
    submitting?: boolean;
    submitError?: string | null;
    onSubmit:    (body: string) => Promise<void> | void;
    onCancel:    () => void;
  }

  let { selection, submitting = false, submitError = null, onSubmit, onCancel }: Props = $props();

  let body = $state('');

  async function submit() {
    if (!body.trim() || submitting) return;
    await onSubmit(body.trim());
    // Parent clears `selection` on success, so we only need to reset on error
    if (!submitError) body = '';
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  }
</script>

<div class="ann-form-wrap" role="dialog" aria-label="Write annotation">
  <div class="ann-form">
    <div class="form-handle" aria-hidden="true"></div>
    <div class="ann-form-quote">"{selection.text}"</div>

    <label for="ann-body" class="ann-form-label">Your annotation</label>
    <textarea
      id="ann-body"
      class="ann-form-textarea"
      placeholder="What does this line mean? Explain the wordplay, cultural reference, or Twi/Pidgin — charley, dey share your knowledge."
      bind:value={body}
      onkeydown={handleKey}
      rows={4}
      maxlength={2000}
      disabled={submitting}
      autofocus
    ></textarea>

    {#if submitError}
      <div class="ann-form-error" role="alert">{submitError}</div>
    {/if}

    <div class="ann-form-footer">
      <span class="ann-form-hint">⌘ + Enter to submit</span>
      <div class="ann-form-actions">
        <button class="btn btn-ghost btn-sm" onclick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button
          class="btn btn-primary btn-sm"
          onclick={submit}
          disabled={submitting || !body.trim()}
        >
          {submitting ? 'Submitting…' : 'Submit annotation'}
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .ann-form-wrap {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(20, 17, 15, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .ann-form {
    background: var(--bg-elevated);
    border-radius: var(--radius-xl);
    padding: 32px;
    width: 100%;
    max-width: 520px;
    box-shadow: var(--shadow-lg);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ann-form-quote {
    font-size: 18px;
    font-weight: 500;
    font-style: italic;
    color: var(--fg);
    line-height: 1.4;
    padding: 12px 16px;
    background: var(--accent-tint);
    border-left: 3px solid var(--accent);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  .ann-form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--fg-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ann-form-textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-family: inherit;
    color: var(--fg);
    background: var(--bg);
    resize: vertical;
    line-height: 1.55;
    outline: none;
    transition: border-color 140ms var(--ease-out), box-shadow 140ms;
  }
  .ann-form-textarea:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(201,70,44,0.15);
  }
  .ann-form-textarea::placeholder { color: var(--fg-subtle); }

  .ann-form-error {
    font-size: 13px;
    color: var(--accent);
    background: var(--accent-tint);
    border: 1px solid rgba(201,70,44,0.25);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
  }

  .ann-form-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .ann-form-hint {
    font-size: 12px;
    color: var(--fg-subtle);
    font-family: var(--font-mono);
  }
  .ann-form-actions {
    display: flex;
    gap: 8px;
  }

  /* Handle is hidden on desktop (centered modal doesn't need it) */
  .form-handle {
    display: none;
    width: 40px; height: 4px;
    background: var(--border-strong);
    border-radius: 2px;
    margin: -4px auto 14px;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .form-handle { display: block; }
    /* Bottom sheet on mobile */
    .ann-form-wrap {
      align-items: flex-end;
      padding: 0;
    }
    .ann-form {
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
      max-width: 100%;
      padding: 16px 20px calc(env(safe-area-inset-bottom, 0px) + 28px);
      animation: slide-up 280ms var(--ease-out);
    }
    /* Drag handle */
    .ann-form-quote { font-size: 15px; }
    .ann-form-hint  { display: none; }
  }

  @keyframes slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }
</style>
