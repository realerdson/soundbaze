<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const user        = $derived(data.user);
  const profile     = $derived(data.profile);
  const annotations = $derived(data.annotations ?? []);

  // Derived display values
  const username  = $derived(profile?.username ?? user?.email?.split('@')[0] ?? 'you');
  const avatarLetter = $derived(username[0]?.toUpperCase() ?? '?');
  const iq        = $derived(profile?.iq_points ?? 0);
  const role      = $derived(profile?.role ?? 'contributor');
  const bio       = $derived(profile?.bio ?? '');

  const totalUpvotes = $derived(annotations.reduce(
    (sum: number, a: { upvotes?: number }) => sum + (a.upvotes ?? 0), 0
  ));

  function iqTier(n: number): string {
    if (n >= 10_000) return 'Gold';
    if (n >= 2_000)  return 'Silver';
    return 'Bronze';
  }

  function relTime(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3_600_000);
    if (h < 1)  return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  let activeTab = $state<'annotations' | 'iq' | 'saved'>('annotations');
</script>

<svelte:head>
  <title>@{username} · SoundBaze</title>
</svelte:head>

<!-- Profile header -->
<section class="dash-hero">
  <div class="container">
    <div class="dash-hero-inner">
      <div class="dash-avatar">{avatarLetter}</div>
      <div class="dash-info">
        <div class="eyebrow" style="margin-bottom: 6px;">{role}</div>
        <h1 class="dash-name">@{username}</h1>
        {#if bio}
          <p class="dash-bio">{bio}</p>
        {:else}
          <p class="dash-bio" style="font-style: italic; color: var(--fg-subtle);">
            No bio yet — <a href="#edit-profile" style="color: var(--link);">add one</a>
          </p>
        {/if}
        <div class="dash-meta">
          <span>{iqTier(iq)} tier</span>
          <span class="dot"></span>
          <span>IQ {iq.toLocaleString()}</span>
          <span class="dot"></span>
          <span>{annotations.length} annotation{annotations.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="dash-iq-card">
        <div class="iq-label">IQ score</div>
        <div class="iq-value">{iq.toLocaleString()}</div>
        <div class="iq-rank">{iqTier(iq)} contributor</div>
        <a href="/community" class="btn btn-ghost btn-sm" style="margin-top: 14px; color: rgba(250,246,238,0.7);">
          View leaderboard
        </a>
      </div>
    </div>

    {#if role === 'moderator' || role === 'admin'}
      <div class="mod-banner">
        <span class="mod-banner-badge">MOD</span>
        <span>You have moderator access.</span>
        <a href="/dashboard/moderation" class="mod-banner-link">Open review queue →</a>
      </div>
    {/if}
  </div>
</section>

<div class="kente-band"></div>

<!-- Tabs + content -->
<div class="container" style="padding-top: 40px; padding-bottom: 80px;">

  <div class="dash-tabs">
    <button class="dash-tab" class:active={activeTab === 'annotations'} onclick={() => (activeTab = 'annotations')}>
      My annotations <span class="tab-count">{annotations.length}</span>
    </button>
    <button class="dash-tab" class:active={activeTab === 'iq'} onclick={() => (activeTab = 'iq')}>
      IQ history
    </button>
    <button class="dash-tab" class:active={activeTab === 'saved'} onclick={() => (activeTab = 'saved')}>
      Saved songs
    </button>
  </div>

  <!-- Annotations tab -->
  {#if activeTab === 'annotations'}
    <div class="dash-section">
      {#if annotations.length === 0}
        <div class="dash-empty">
          <strong>No annotations yet, charley.</strong>
          Find a song and highlight any line to write your first annotation.
          <br />
          <a href="/" class="btn btn-primary btn-sm" style="margin-top: 16px; display: inline-flex;">Browse songs →</a>
        </div>
      {:else}
        {#each annotations as ann}
          {@const song = (ann as { songs?: { title?: string; slug?: string } }).songs}
          <div class="dash-ann-card">
            <div class="dash-ann-header">
              {#if song?.slug}
                <a href="/songs/{song.slug}" class="dash-ann-song">{song.title ?? 'Unknown song'}</a>
              {:else}
                <span class="dash-ann-song">{(ann as { song_id?: string }).song_id ?? '—'}</span>
              {/if}
              <span class="pill pill-accent">↑ {(ann as { upvotes?: number }).upvotes ?? 0}</span>
              <span class="pill pill-neutral" style="text-transform: capitalize;">
                {(ann as { status?: string }).status ?? 'pending'}
              </span>
              {#if (ann as { created_at?: string }).created_at}
                <span class="dash-ann-time">{relTime((ann as { created_at: string }).created_at)}</span>
              {/if}
            </div>
            <p class="dash-ann-body">{(ann as { body?: string }).body ?? ''}</p>
          </div>
        {/each}
      {/if}
    </div>
  {/if}

  <!-- IQ tab -->
  {#if activeTab === 'iq'}
    <div class="dash-section">
      <div class="iq-summary">
        <div class="iq-summary-item">
          <div class="iq-summary-value">{iq.toLocaleString()}</div>
          <div class="iq-summary-label">Total IQ</div>
        </div>
        <div class="iq-summary-item">
          <div class="iq-summary-value">{annotations.length}</div>
          <div class="iq-summary-label">Annotations</div>
        </div>
        <div class="iq-summary-item">
          <div class="iq-summary-value">{totalUpvotes}</div>
          <div class="iq-summary-label">Total upvotes</div>
        </div>
      </div>

      <p class="dash-empty" style="border-style: solid;">
        IQ event history will appear here as your annotations get upvoted and approved.
      </p>
    </div>
  {/if}

  <!-- Saved tab -->
  {#if activeTab === 'saved'}
    <div class="dash-section">
      <div class="dash-empty">
        <strong>No saved songs yet.</strong>
        Hit the bookmark icon on any song page to save it here.
      </div>
    </div>
  {/if}

</div>

<style>
  /* Hero */
  .dash-hero {
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    padding: 48px 0;
  }
  .dash-hero-inner {
    display: grid;
    grid-template-columns: auto 1fr auto;
    gap: 28px;
    align-items: start;
  }
  .dash-avatar {
    width: 88px; height: 88px;
    border-radius: 50%;
    background: var(--charcoal-brown);
    color: var(--floral-white);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; font-weight: 700;
    flex-shrink: 0;
  }
  .dash-name {
    font-size: 32px; font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--fg);
    margin-bottom: 6px;
  }
  .dash-bio  { font-size: 15px; color: var(--fg-muted); max-width: 520px; }
  .dash-meta {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--fg-subtle); margin-top: 10px;
  }
  .dash-meta .dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; }

  /* IQ card */
  .dash-iq-card {
    background: var(--charcoal-brown);
    color: var(--floral-white);
    border-radius: var(--radius-xl);
    padding: 24px 28px;
    min-width: 200px;
    text-align: center;
  }
  .iq-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.6; }
  .iq-value { font-size: 44px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; margin: 8px 0 4px; color: var(--accent); }
  .iq-rank  { font-size: 13px; opacity: 0.7; }

  /* Tabs */
  .dash-tabs {
    display: flex; gap: 4px;
    padding: 4px; background: var(--bg-sunken);
    border-radius: var(--radius-pill);
    margin-bottom: 28px;
    width: fit-content;
  }
  .dash-tab {
    padding: 8px 18px; border-radius: var(--radius-pill);
    font-size: 14px; font-weight: 500; color: var(--fg-muted);
    cursor: pointer; background: transparent; border: none;
    font-family: inherit; display: flex; align-items: center; gap: 6px;
    transition: all 140ms var(--ease-out);
  }
  .dash-tab:hover  { color: var(--fg); }
  .dash-tab.active { background: var(--bg-elevated); color: var(--fg); box-shadow: var(--shadow-sm); }
  .tab-count {
    font-size: 12px; background: var(--accent-tint);
    color: var(--paprika-deep, #A33820);
    padding: 1px 7px; border-radius: var(--radius-pill);
  }
  .dash-section { max-width: 800px; }

  /* Annotation cards */
  .dash-ann-card {
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    padding: 20px 24px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 12px;
    border: 1px solid var(--border);
  }
  .dash-ann-header {
    display: flex; align-items: center; gap: 10px;
    flex-wrap: wrap; margin-bottom: 10px;
  }
  .dash-ann-song { font-size: 13px; font-weight: 600; color: var(--accent); text-decoration: none; }
  .dash-ann-song:hover { text-decoration: underline; }
  .dash-ann-time { font-size: 12px; color: var(--fg-subtle); margin-left: auto; font-family: var(--font-mono); }
  .dash-ann-body { font-size: 14px; color: var(--fg-muted); line-height: 1.55; }

  /* IQ summary */
  .iq-summary {
    display: flex;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    overflow: hidden;
    margin-bottom: 24px;
    width: fit-content;
  }
  .iq-summary-item {
    padding: 20px 32px;
    text-align: center;
    border-right: 1px solid var(--border);
  }
  .iq-summary-item:last-child { border-right: none; }
  .iq-summary-value { font-size: 28px; font-weight: 700; letter-spacing: -0.02em; color: var(--fg); }
  .iq-summary-label { font-size: 12px; color: var(--fg-subtle); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.08em; }

  .dash-empty {
    padding: 32px 24px; border: 1.5px dashed var(--border-strong);
    border-radius: var(--radius-xl); color: var(--fg-muted);
    font-size: 15px; line-height: 1.5;
  }
  .dash-empty strong { display: block; color: var(--fg); margin-bottom: 6px; }

  /* Moderator banner */
  .mod-banner {
    display: flex; align-items: center; gap: 10px;
    margin-top: 20px;
    padding: 10px 16px;
    background: rgba(201,70,44,0.12);
    border: 1px solid rgba(201,70,44,0.3);
    border-radius: var(--radius-lg);
    font-size: 13px;
    color: rgba(250,246,238,0.85);
  }
  .mod-banner-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    background: var(--accent); color: #fff;
    padding: 2px 6px; border-radius: 4px;
  }
  .mod-banner-link {
    margin-left: auto; color: var(--accent);
    font-weight: 600; text-decoration: none;
    font-size: 13px;
  }
  .mod-banner-link:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .dash-hero-inner { grid-template-columns: auto 1fr; }
    .dash-iq-card    { grid-column: 1 / -1; }
  }
</style>
