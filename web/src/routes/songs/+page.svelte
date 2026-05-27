<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const songs       = $derived(data.songs       ?? []);
  const genres      = $derived(data.genres      ?? ['All']);
  const activeGenre = $derived(data.activeGenre ?? 'All');
  const activeSort  = $derived(data.activeSort  ?? 'popular');

  function navTo(params: Record<string, string>) {
    const sp = new URLSearchParams({ genre: activeGenre, sort: activeSort, ...params });
    window.location.href = `/songs?${sp}`;
  }
</script>

<svelte:head>
  <title>Songs · SoundBaze</title>
</svelte:head>

<!-- Header -->
<section style="background: var(--bg-elevated); border-bottom: 1px solid var(--border); padding: 48px 0 36px;">
  <div class="container">
    <div class="eyebrow" style="margin-bottom: 10px;">Library</div>
    <h1 style="font-size: 42px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 10px;">All songs</h1>
    <p style="font-size: 17px; color: var(--fg-muted); max-width: 520px; line-height: 1.55;">
      Every song with community annotations — hiplife, drill, alté, gospel highlife, and more.
    </p>
  </div>
</section>

<div class="kente-band"></div>

<div class="container" style="padding: 40px 0 80px;">

  <!-- Filters row -->
  <div class="songs-filters">
    <!-- Genre tabs -->
    <div class="genre-tabs">
      {#each genres as genre}
        <button
          class="genre-tab"
          class:active={activeGenre === genre}
          onclick={() => navTo({ genre })}
        >{genre}</button>
      {/each}
    </div>

    <!-- Sort -->
    <div class="sort-select-wrap">
      <label for="sort" class="sr-only">Sort by</label>
      <select
        id="sort"
        class="sort-select"
        value={activeSort}
        onchange={(e) => navTo({ sort: (e.target as HTMLSelectElement).value })}
      >
        <option value="popular">Most read</option>
        <option value="annotations">Most annotated</option>
        <option value="recent">Most recent</option>
      </select>
    </div>
  </div>

  <!-- Results count -->
  <p style="font-size: 14px; color: var(--fg-subtle); margin-bottom: 24px;">
    {songs.length} song{songs.length !== 1 ? 's' : ''}
    {activeGenre !== 'All' ? `· ${activeGenre}` : ''}
  </p>

  <!-- Songs grid -->
  {#if songs.length === 0}
    <p style="color: var(--fg-subtle); font-style: italic; padding: 40px 0;">
      No songs here yet, charley. Check back soon.
    </p>
  {:else}
    <div class="trending-grid">
      {#each songs as song, i}
        <a href="/songs/{song.id}" class="song-row">
          <span class="song-row-rank">{String(i + 1).padStart(2, '0')}</span>
          <div class="album-cover" style="width: 56px; height: 56px;">
            <img src={song.cover} alt="" />
          </div>
          <div class="song-row-meta">
            <div class="song-row-title">{song.title}</div>
            <div class="song-row-sub">
              {song.artist}
              {#if song.year > 0} · {song.year}{/if}
            </div>
            <div class="song-row-pills">
              <span class="pill pill-accent">{song.annotationCount} annotations</span>
              {#if song.reads && song.reads !== '—'}<span class="pill pill-neutral">{song.reads} reads</span>{/if}
              {#if song.genre}<span class="pill pill-outline">{song.genre}</span>{/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .songs-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .genre-tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .genre-tab {
    padding: 6px 16px;
    border-radius: var(--radius-pill);
    border: 1.5px solid var(--border-strong);
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: var(--fg-muted);
    cursor: pointer;
    font-family: inherit;
    transition: all 140ms var(--ease-out);
  }
  .genre-tab:hover { color: var(--fg); border-color: var(--fg-muted); }
  .genre-tab.active {
    background: var(--charcoal-brown);
    border-color: var(--charcoal-brown);
    color: var(--floral-white);
  }

  .sort-select-wrap { position: relative; }
  .sort-select {
    appearance: none;
    padding: 8px 36px 8px 14px;
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    background: var(--bg-elevated);
    font-size: 14px;
    font-family: inherit;
    color: var(--fg);
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%237A6458' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
  }
  .sort-select:focus { outline: 2px solid var(--accent); outline-offset: 2px; }

  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
</style>
