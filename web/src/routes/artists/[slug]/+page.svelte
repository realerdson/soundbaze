<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const artist   = $derived(data.artist);
  const topSongs = $derived(data.topSongs);
</script>

<svelte:head>
  <title>{artist.name} · SoundBaze</title>
  <meta name="description" content="{artist.bio?.slice(0, 155) ?? artist.name + ' on SoundBaze — line-by-line annotations.'}" />
  <meta property="og:type"        content="profile" />
  <meta property="og:title"       content="{artist.name} · SoundBaze" />
  <meta property="og:description" content="{artist.bio?.slice(0, 155) ?? ''}" />
  <meta property="og:image"       content={artist.cover} />
  <meta property="og:site_name"   content="SoundBaze" />
  <meta name="twitter:card"       content="summary" />
  <meta name="twitter:title"      content="{artist.name} on SoundBaze" />
  <meta name="twitter:image"      content={artist.cover} />
</svelte:head>

<!-- ── Artist hero ────────────────────────────────────────────────────────── -->
<section class="artist-hero">
  <div class="container artist-hero-inner">
    <div class="artist-hero-img">
      <img src={artist.cover} alt={artist.name} />
    </div>
    <div>
      <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; opacity: 0.8;">Artist</div>
      <h1 class="artist-hero-name">{artist.name}</h1>
      <p class="artist-hero-bio">{artist.bio}</p>
      <div class="artist-hero-stats">
        <div>
          <div class="stat-label">Followers</div>
          <div class="stat-value">{artist.followers}</div>
        </div>
        <div>
          <div class="stat-label">Monthly readers</div>
          <div class="stat-value">{artist.monthly}</div>
        </div>
      </div>
      <div style="margin-top: 24px; display: flex; gap: 10px;">
        <button class="btn btn-secondary btn-pill">Follow</button>
        <button class="btn btn-ghost btn-pill" style="color: var(--floral-white); border-color: rgba(250,246,238,0.3);">Share</button>
      </div>
    </div>
  </div>
</section>

<div class="kente-band kente-band-thick"></div>

<!-- ── Top songs ──────────────────────────────────────────────────────────── -->
<section class="container section">
  <div class="section-head">
    <h2 class="section-title">Top songs</h2>
    <span style="color: var(--fg-muted); font-size: 14px;">Most-read this month</span>
  </div>
  <div class="trending-grid">
    {#each topSongs as song, i}
      {#if song}
        <a href="/songs/{song.id}" class="song-row">
          <span class="song-row-rank">{String(i + 1).padStart(2, '0')}</span>
          <div class="album-cover" style="width: 56px; height: 56px;">
            <img src={song.cover} alt="" />
          </div>
          <div class="song-row-meta">
            <div class="song-row-title">{song.title}</div>
            <div class="song-row-sub">{song.album} · {song.year}</div>
            <div class="song-row-pills">
              <span class="pill pill-accent">{song.annotationCount} annotations</span>
            </div>
          </div>
        </a>
      {/if}
    {/each}
  </div>
</section>
