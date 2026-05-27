<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const pending      = $derived(data.pending ?? []);
  const flagged      = $derived(data.flagged ?? []);
  const pendingCount = $derived(data.pendingCount ?? 0);
  const flaggedCount = $derived(data.flaggedCount ?? 0);

  let activeTab = $state<'pending' | 'flagged'>('pending');

  // Track which annotation is being actioned (for spinner)
  let actioning = $state<string | null>(null);

  function relTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1)  return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  /** Truncate body for the preview card */
  function preview(text: string, max = 200): string {
    return text.length > max ? text.slice(0, max) + '…' : text;
  }
</script>

<svelte:head>
  <title>Moderation queue · SoundBaze</title>
</svelte:head>

<!-- ── Header ────────────────────────────────────────────────────────────── -->
<section class="mod-header">
  <div class="container">
    <div class="mod-header-inner">
      <div>
        <div class="eyebrow">Moderation</div>
        <h1 class="mod-title">Review queue</h1>
        <p class="mod-sub">
          Approve annotations that add value. Reject spam. Ban users who abuse the platform.
        </p>
      </div>
      <div class="mod-stats">
        <div class="mod-stat">
          <div class="mod-stat-value">{pendingCount}</div>
          <div class="mod-stat-label">Pending</div>
        </div>
        <div class="mod-stat mod-stat-warn">
          <div class="mod-stat-value">{flaggedCount}</div>
          <div class="mod-stat-label">Flagged</div>
        </div>
      </div>
    </div>
  </div>
</section>

<div class="kente-band"></div>

<!-- ── Main content ───────────────────────────────────────────────────────── -->
<div class="container" style="padding-top: 36px; padding-bottom: 80px;">

  <nav class="mod-tabs" aria-label="Queue tabs">
    <button class="mod-tab" class:active={activeTab === 'pending'} onclick={() => activeTab = 'pending'}>
      Pending
      {#if pendingCount > 0}
        <span class="tab-badge">{pendingCount}</span>
      {/if}
    </button>
    <button class="mod-tab" class:active={activeTab === 'flagged'} onclick={() => activeTab = 'flagged'}>
      Flagged
      {#if flaggedCount > 0}
        <span class="tab-badge tab-badge-warn">{flaggedCount}</span>
      {/if}
    </button>
  </nav>

  <!-- Pending queue -->
  {#if activeTab === 'pending'}
    {#if pending.length === 0}
      <div class="mod-empty">
        <strong>All clear, charley.</strong>
        No annotations waiting for review right now.
      </div>
    {:else}
      <div class="queue-list">
        {#each pending as ann}
          {@const profile = (ann as { profiles?: { username?: string; iq_points?: number } }).profiles}
          {@const song    = (ann as { songs?: { title?: string; slug?: string } }).songs}
          {@const annId   = (ann as { id: string }).id}
          {@const userId  = (ann as { user_id?: string }).user_id ?? ''}
          {@const body    = (ann as { body?: string }).body ?? ''}
          {@const createdAt = (ann as { created_at?: string }).created_at ?? ''}

          <article class="ann-card">
            <div class="ann-meta">
              <span class="ann-author">@{profile?.username ?? '—'}</span>
              <span class="ann-iq">IQ {(profile?.iq_points ?? 0).toLocaleString()}</span>
              <span class="dot"></span>
              {#if song?.slug}
                <a href="/songs/{song.slug}" class="ann-song-link" target="_blank" rel="noopener">
                  {song.title}
                </a>
              {:else}
                <span class="ann-song-link">Unknown song</span>
              {/if}
              <span class="ann-time">{createdAt ? relTime(createdAt) : '—'}</span>
            </div>

            <p class="ann-body">{preview(body)}</p>

            <div class="ann-actions">
              <!-- Approve -->
              <form method="POST" action="?/approve" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id" value={annId} />
                <button class="btn-mod btn-approve" disabled={actioning === annId}>
                  {actioning === annId ? '…' : '✓ Approve'}
                </button>
              </form>

              <!-- Reject -->
              <form method="POST" action="?/reject" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id" value={annId} />
                <button class="btn-mod btn-reject" disabled={actioning === annId}>
                  {actioning === annId ? '…' : '✗ Reject'}
                </button>
              </form>

              <!-- Ban user -->
              <form method="POST" action="?/ban" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id"      value={annId} />
                <input type="hidden" name="user_id" value={userId} />
                <button
                  class="btn-mod btn-ban"
                  disabled={actioning === annId}
                  onclick={(e) => {
                    if (!confirm(`Ban @${profile?.username ?? 'this user'}? This will reject all their pending annotations.`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  {actioning === annId ? '…' : '⛔ Ban user'}
                </button>
              </form>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Flagged queue -->
  {#if activeTab === 'flagged'}
    {#if flagged.length === 0}
      <div class="mod-empty">
        <strong>No flagged content.</strong>
        Community-flagged annotations will appear here.
      </div>
    {:else}
      <div class="queue-list">
        {#each flagged as ann}
          {@const profile    = (ann as { profiles?: { username?: string; iq_points?: number } }).profiles}
          {@const song       = (ann as { songs?: { title?: string; slug?: string } }).songs}
          {@const annId      = (ann as { id: string }).id}
          {@const userId     = (ann as { user_id?: string }).user_id ?? ''}
          {@const body       = (ann as { body?: string }).body ?? ''}
          {@const flagCount  = (ann as { flagged_count?: number }).flagged_count ?? 0}
          {@const createdAt  = (ann as { created_at?: string }).created_at ?? ''}

          <article class="ann-card ann-card-flagged">
            <div class="ann-meta">
              <span class="ann-author">@{profile?.username ?? '—'}</span>
              <span class="flag-count">🚩 {flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
              <span class="dot"></span>
              {#if song?.slug}
                <a href="/songs/{song.slug}" class="ann-song-link" target="_blank" rel="noopener">
                  {song.title}
                </a>
              {:else}
                <span class="ann-song-link">Unknown song</span>
              {/if}
              <span class="ann-time">{createdAt ? relTime(createdAt) : '—'}</span>
            </div>

            <p class="ann-body">{preview(body)}</p>

            <div class="ann-actions">
              <form method="POST" action="?/approve" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id" value={annId} />
                <button class="btn-mod btn-approve" disabled={actioning === annId}>
                  {actioning === annId ? '…' : '✓ Keep (unflag)'}
                </button>
              </form>

              <form method="POST" action="?/reject" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id" value={annId} />
                <button class="btn-mod btn-reject" disabled={actioning === annId}>
                  {actioning === annId ? '…' : '✗ Remove'}
                </button>
              </form>

              <form method="POST" action="?/ban" use:enhance={() => {
                actioning = annId;
                return ({ update }) => { actioning = null; update(); };
              }}>
                <input type="hidden" name="id"      value={annId} />
                <input type="hidden" name="user_id" value={userId} />
                <button
                  class="btn-mod btn-ban"
                  disabled={actioning === annId}
                  onclick={(e) => {
                    if (!confirm(`Ban @${profile?.username ?? 'this user'}?`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  {actioning === annId ? '…' : '⛔ Ban user'}
                </button>
              </form>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  {/if}

  <div style="margin-top: 40px;">
    <a href="/dashboard" class="btn btn-ghost btn-sm">← Back to dashboard</a>
  </div>
</div>

<style>
  /* Header */
  .mod-header {
    background: var(--charcoal-brown);
    color: var(--floral-white);
    padding: 40px 0;
  }
  .mod-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
  }
  .mod-title  { font-size: 28px; font-weight: 700; margin: 6px 0 8px; }
  .mod-sub    { font-size: 14px; opacity: 0.7; max-width: 480px; }

  .mod-stats  { display: flex; gap: 16px; }
  .mod-stat {
    text-align: center;
    background: rgba(255,255,255,0.08);
    border-radius: var(--radius-lg);
    padding: 16px 24px;
    min-width: 80px;
  }
  .mod-stat-warn { background: rgba(201,70,44,0.25); }
  .mod-stat-value { font-size: 32px; font-weight: 700; line-height: 1; color: var(--floral-white); }
  .mod-stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; margin-top: 4px; }

  /* Tabs */
  .mod-tabs {
    display: flex; gap: 4px;
    padding: 4px; background: var(--bg-sunken);
    border-radius: var(--radius-pill);
    margin-bottom: 24px;
    width: fit-content;
  }
  .mod-tab {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: var(--radius-pill);
    font-size: 14px; font-weight: 500; color: var(--fg-muted);
    cursor: pointer; background: transparent; border: none;
    font-family: inherit;
    transition: all 140ms var(--ease-out);
  }
  .mod-tab:hover  { color: var(--fg); }
  .mod-tab.active { background: var(--bg-elevated); color: var(--fg); box-shadow: var(--shadow-sm); }

  .tab-badge {
    font-size: 11px; font-weight: 600;
    background: var(--accent-tint); color: var(--paprika-deep, #A33820);
    padding: 1px 6px; border-radius: var(--radius-pill);
  }
  .tab-badge-warn { background: #fef2f2; color: var(--accent); }

  /* Queue list */
  .queue-list { display: flex; flex-direction: column; gap: 12px; max-width: 900px; }

  /* Annotation card */
  .ann-card {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    box-shadow: var(--shadow-sm);
  }
  .ann-card-flagged { border-left: 3px solid var(--accent); }

  .ann-meta {
    display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap; margin-bottom: 12px;
    font-size: 13px;
  }
  .ann-author   { font-weight: 600; color: var(--fg); }
  .ann-iq       { font-size: 11px; color: var(--fg-subtle); background: var(--bg-sunken); padding: 1px 6px; border-radius: 4px; }
  .ann-song-link { color: var(--accent); text-decoration: none; font-weight: 500; }
  .ann-song-link:hover { text-decoration: underline; }
  .ann-time     { font-size: 12px; color: var(--fg-subtle); margin-left: auto; font-family: var(--font-mono); }
  .flag-count   { font-size: 12px; color: var(--accent); font-weight: 600; }
  .dot          { width: 3px; height: 3px; border-radius: 50%; background: var(--fg-subtle); }

  .ann-body {
    font-size: 14px; color: var(--fg); line-height: 1.6;
    margin-bottom: 16px;
    padding: 12px 14px;
    background: var(--bg-sunken);
    border-radius: var(--radius-md);
    font-style: italic;
  }

  /* Action buttons */
  .ann-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .btn-mod {
    padding: 7px 14px;
    border-radius: var(--radius-md);
    font-size: 13px; font-weight: 500; font-family: inherit;
    cursor: pointer; border: 1.5px solid transparent;
    transition: opacity 0.13s, transform 0.1s;
  }
  .btn-mod:disabled     { opacity: 0.5; cursor: not-allowed; }
  .btn-mod:not(:disabled):active { transform: scale(0.97); }

  .btn-approve {
    background: #d1fae5; color: #065f46; border-color: #6ee7b7;
  }
  .btn-approve:not(:disabled):hover { background: #a7f3d0; }

  .btn-reject {
    background: #fee2e2; color: #991b1b; border-color: #fca5a5;
  }
  .btn-reject:not(:disabled):hover { background: #fecaca; }

  .btn-ban {
    background: var(--charcoal-brown); color: var(--floral-white);
    border-color: var(--charcoal-brown);
    margin-left: auto;
  }
  .btn-ban:not(:disabled):hover { opacity: 0.85; }

  /* Empty state */
  .mod-empty {
    padding: 32px 24px;
    border: 1.5px dashed var(--border-strong);
    border-radius: var(--radius-xl);
    color: var(--fg-muted); font-size: 15px; line-height: 1.5;
    max-width: 600px;
  }
  .mod-empty strong { display: block; color: var(--fg); margin-bottom: 6px; }

  @media (max-width: 640px) {
    .mod-header-inner { flex-direction: column; }
    .mod-stats { width: 100%; }
    .mod-stat  { flex: 1; }
    .ann-actions { gap: 6px; }
    .btn-ban { margin-left: 0; }
  }
</style>
