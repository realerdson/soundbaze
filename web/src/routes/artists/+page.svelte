<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const artists = $derived(data.artists ?? []);
</script>

<svelte:head>
  <title>Artists · SoundBaze</title>
</svelte:head>

<!-- Header -->
<section style="background: var(--bg-elevated); border-bottom: 1px solid var(--border); padding: 48px 0 36px;">
  <div class="container">
    <div class="eyebrow" style="margin-bottom: 10px;">Directory</div>
    <h1 style="font-size: 42px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 10px;">Artists</h1>
    <p style="font-size: 17px; color: var(--fg-muted); max-width: 520px; line-height: 1.55;">
      Hiplife, drill, alté, gospel highlife — every Ghanaian artist whose lyrics have a second layer worth reading.
    </p>
  </div>
</section>

<div class="kente-band"></div>

<div class="container" style="padding: 48px 0 80px;">
  {#if artists.length === 0}
    <p style="color: var(--fg-subtle); font-style: italic;">No artists yet, charley. Check back soon.</p>
  {:else}
    <div class="artists-grid">
      {#each artists as artist}
        <a href="/artists/{artist.slug}" class="artist-card">
          <div class="artist-cover">
            {#if artist.cover}
              <img src={artist.cover} alt={artist.name} />
            {:else}
              <div class="artist-cover-placeholder">{artist.name[0]}</div>
            {/if}
          </div>
          <div class="artist-info">
            <div class="artist-name">
              {artist.name}
              {#if artist.verified}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--accent)" aria-label="Verified" style="display:inline;vertical-align:middle;margin-left:4px;">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {/if}
            </div>
            <div class="artist-followers">{artist.followers} followers</div>
            {#if artist.bio}
              <p class="artist-bio">{artist.bio.slice(0, 80)}{artist.bio.length > 80 ? '…' : ''}</p>
            {/if}
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .artists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .artist-card {
    display: flex;
    gap: 18px;
    align-items: flex-start;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: 20px;
    text-decoration: none;
    transition: all 180ms var(--ease-out);
  }
  .artist-card:hover {
    border-color: var(--accent);
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .artist-cover {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    background: var(--bg-sunken);
  }
  .artist-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .artist-cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    color: var(--fg-subtle);
    background: var(--bg-sunken);
  }

  .artist-info { flex: 1; min-width: 0; }
  .artist-name {
    font-size: 17px;
    font-weight: 700;
    color: var(--fg);
    margin-bottom: 3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .artist-followers {
    font-size: 13px;
    color: var(--fg-subtle);
    margin-bottom: 8px;
  }
  .artist-bio {
    font-size: 13px;
    color: var(--fg-muted);
    line-height: 1.5;
    margin: 0;
  }

  @media (max-width: 640px) {
    .artists-grid { grid-template-columns: 1fr; }
  }
</style>
