<script lang="ts">
  import { page }  from '$app/stores';
  import { onMount } from 'svelte';

  let q   = $derived($page.url.searchParams.get('q') ?? '');
  let tab = $state<'all' | 'songs' | 'artists'>('all');

  // ── Results state ─────────────────────────────────────────────────────────
  interface SongResult   { id: string; title: string; artist: string; artist_name?: string; album?: string; cover?: string; cover_url?: string; annotationCount?: number; annotation_count?: number; reads?: string }
  interface ArtistResult { id: string; name: string; cover?: string; image_url?: string; followers?: string; follower_count?: number }

  let songs:   SongResult[]   = $state([]);
  let artists: ArtistResult[] = $state([]);
  let loading = $state(false);
  let fetched = $state('');   // last query we actually fetched, to avoid stale renders

  let debounceTimer: ReturnType<typeof setTimeout>;

  async function doSearch(query: string) {
    if (!query.trim()) { songs = []; artists = []; fetched = ''; return; }
    loading = true;
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      songs   = data.songs   ?? [];
      artists = data.artists ?? [];
      fetched = query;
    } catch {
      // Keep existing results on network error
    } finally {
      loading = false;
    }
  }

  // Run search whenever q (derived from URL) changes
  $effect(() => {
    clearTimeout(debounceTimer);
    const current = q;
    debounceTimer = setTimeout(() => doSearch(current), 180);
  });

  // Run immediately on mount (SSR doesn't run $effect)
  onMount(() => { if (q) doSearch(q); });

  const totalResults = $derived(songs.length + artists.length);

  // Helpers to normalise Supabase vs mock field names
  function songCover(s: SongResult)   { return s.cover_url ?? s.cover ?? ''; }
  function songArtist(s: SongResult)  { return s.artist_name ?? s.artist ?? ''; }
  function songCount(s: SongResult)   { return s.annotation_count ?? s.annotationCount ?? 0; }
  function artistCover(a: ArtistResult) { return a.image_url ?? a.cover ?? ''; }
  function artistFollowers(a: ArtistResult) {
    if (a.follower_count != null) return `${Math.round((a.follower_count as number) / 1000)}K`;
    return a.followers ?? '';
  }
</script>

<svelte:head>
  <title>{q ? `"${q}" — Search` : 'Search'} · SoundBaze</title>
</svelte:head>

<div class="container search-page">
  <h1>{q ? `Results for "${q}"` : 'Search'}</h1>
  <p class="lead" style="color: var(--fg-muted); margin-bottom: 32px;">
    {#if loading}
      Searching…
    {:else if fetched}
      {totalResults} result{totalResults !== 1 ? 's' : ''}
    {:else if q}
      Type to search
    {/if}
  </p>

  <!-- Tabs -->
  <div class="search-tabs">
    <button class="search-tab" class:active={tab === 'all'}     onclick={() => (tab = 'all')}>All</button>
    <button class="search-tab" class:active={tab === 'songs'}   onclick={() => (tab = 'songs')}>Songs ({songs.length})</button>
    <button class="search-tab" class:active={tab === 'artists'} onclick={() => (tab = 'artists')}>Artists ({artists.length})</button>
  </div>

  {#if loading && !fetched}
    <div class="search-loading" aria-live="polite">
      <div class="search-loading-dots"><span></span><span></span><span></span></div>
    </div>
  {:else}

    <!-- Songs -->
    {#if tab === 'all' || tab === 'songs'}
      {#if tab === 'all'}
        <div style="margin-bottom: 16px;">
          <div class="eyebrow" style="margin-bottom: 8px;">Songs</div>
        </div>
      {/if}
      <div class="search-results-list" style="margin-bottom: 40px;">
        {#each songs as song (song.id)}
          <a href="/songs/{song.id}" class="song-row">
            <div class="album-cover" style="width: 56px; height: 56px;">
              <img src={songCover(song)} alt="" />
            </div>
            <div class="song-row-meta">
              <div class="song-row-title">{song.title}</div>
              <div class="song-row-sub">{songArtist(song)}{song.album ? ` · ${song.album}` : ''}</div>
              <div class="song-row-pills">
                <span class="pill pill-accent">{songCount(song)} annotations</span>
                {#if song.reads}<span class="pill pill-neutral">{song.reads} reads</span>{/if}
              </div>
            </div>
          </a>
        {:else}
          {#if fetched}
            <p style="color: var(--fg-subtle); grid-column: 1/-1;">
              Eish — no songs match "{q}". Try another search, charley.
            </p>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Artists -->
    {#if tab === 'all' || tab === 'artists'}
      {#if tab === 'all'}
        <div style="margin-bottom: 16px;">
          <div class="eyebrow" style="margin-bottom: 8px;">Artists</div>
        </div>
      {/if}
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px;">
        {#each artists as artist (artist.id)}
          <a href="/artists/{artist.id}" class="artist-card song-row">
            <div style="width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: var(--bg-sunken);">
              <img src={artistCover(artist)} alt={artist.name} style="width: 100%; height: 100%; object-fit: cover;" />
            </div>
            <div>
              <div style="font-size: 15px; font-weight: 600; color: var(--fg);">{artist.name}</div>
              <div style="font-size: 13px; color: var(--fg-subtle); margin-top: 2px;">{artistFollowers(artist)} followers</div>
            </div>
          </a>
        {:else}
          {#if fetched && (tab === 'all' || tab === 'artists')}
            <p style="color: var(--fg-subtle);">No artists match "{q}".</p>
          {/if}
        {/each}
      </div>
    {/if}

    <!-- Empty state (no query) -->
    {#if !q}
      <div class="search-empty">
        <div class="search-empty-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--fg-subtle)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
        <p>Search for a song, artist, or lyric.</p>
        <p class="search-empty-hint">Try "Kojo Adwoa", "Abrokyire blues", or paste a lyric line.</p>
      </div>
    {/if}
  {/if}
</div>

<style>
  .search-page   { padding-top: 48px; padding-bottom: 80px; }
  .search-page h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 4px; }

  .artist-card {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    padding: 16px;
    box-shadow: var(--shadow-sm);
    text-decoration: none;
    color: inherit;
    transition: all 200ms var(--ease-out);
  }

  /* Loading dots */
  .search-loading {
    padding: 60px 0;
    display: flex;
    justify-content: center;
  }
  .search-loading-dots {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .search-loading-dots span {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: dot-pulse 1.2s ease-in-out infinite;
  }
  .search-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .search-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes dot-pulse {
    0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
    40%            { opacity: 1;   transform: scale(1);   }
  }

  /* Empty state */
  .search-empty {
    padding: 80px 0;
    text-align: center;
    color: var(--fg-muted);
  }
  .search-empty-icon { margin-bottom: 16px; opacity: 0.5; }
  .search-empty p    { font-size: 16px; margin: 0 0 6px; }
  .search-empty-hint { font-size: 13px; color: var(--fg-subtle); }
</style>
