<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const songs    = $derived(data.songs);
  const community = $derived(data.community);

  const covers = Array.from({ length: 12 }, (_, i) =>
    `/assets/album-art/cover-${String(i + 1).padStart(2, '0')}.svg`
  );
  const marquee = [...covers, ...covers];
</script>

<svelte:head>
  <title>SoundBaze — Line-by-line annotations for Ghanaian music</title>
</svelte:head>

<!-- ── Hero ──────────────────────────────────────────────────────────────── -->
<section class="hero">
  <div class="hero-carousel" aria-hidden="true">
    <div class="hero-marquee">
      {#each marquee as src}
        <div class="hero-cover">
          <img {src} alt="" />
        </div>
      {/each}
    </div>
  </div>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="hero-content">
    <span class="hero-eyebrow">New releases · this week</span>
    <h1 class="hero-headline">Every song<br/>has a <em>second</em><br/>layer.</h1>
    <p class="hero-lead">
      Charley, SoundBaze is where you find it. Line-by-line annotations for the music you grew up on
      — hiplife, drill, alté, gospel highlife — read by the people who actually know the songs.
    </p>
    <div class="hero-cta">
      <a href="/songs/abrokyire-blues" class="btn btn-primary btn-lg">Find a song</a>
      <a href="/about" class="btn btn-ghost btn-lg">How it works</a>
    </div>
  </div>
</section>

<div class="kente-band kente-band-thick"></div>

<!-- ── Trending grid ─────────────────────────────────────────────────────── -->
<section class="container section">
  <div class="section-head">
    <div>
      <div class="eyebrow" style="margin-bottom: 6px;">This week</div>
      <h2 class="section-title">Trending close reads</h2>
    </div>
    <a href="/songs" class="btn btn-link" style="font-size: 14px;">See all →</a>
  </div>
  <div class="trending-grid">
    {#each songs as song, i}
      <a href="/songs/{song.id}" class="song-row">
        <span class="song-row-rank">{String(i + 1).padStart(2, '0')}</span>
        <div class="album-cover" style="width: 56px; height: 56px;">
          <img src={song.cover} alt="" />
        </div>
        <div class="song-row-meta">
          <div class="song-row-title">{song.title}</div>
          <div class="song-row-sub">{song.artist} · {song.album}</div>
          <div class="song-row-pills">
            <span class="pill pill-accent">{song.annotationCount} annotations</span>
            <span class="pill pill-neutral">{song.reads} reads</span>
          </div>
        </div>
      </a>
    {/each}
  </div>
</section>

<div class="kente-band"></div>

<!-- ── Feature row 1 ─────────────────────────────────────────────────────── -->
<section class="container">
  <div class="feature-row">
    <div class="feature-art">
      <svg width="280" height="200" viewBox="0 0 360 240" fill="none" stroke="var(--charcoal-brown)" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="120" cy="120" r="78" stroke-width="3"/>
        <circle cx="120" cy="120" r="58" stroke-width="1.5" stroke-dasharray="2 6"/>
        <circle cx="120" cy="120" r="38" stroke-width="1.5"/>
        <circle cx="120" cy="120" r="10" fill="#C9462C" stroke="none"/>
        <circle cx="120" cy="120" r="3" fill="var(--charcoal-brown)" stroke="none"/>
        <path d="M220 80 L220 160" stroke-width="3.5" stroke="#C9462C"/>
        <path d="M240 60 L240 180" stroke-width="3.5" stroke="#C9462C"/>
        <path d="M260 90 L260 150" stroke-width="3.5"/>
        <path d="M280 70 L280 170" stroke-width="3.5"/>
        <path d="M300 95 L300 145" stroke-width="3.5"/>
        <path d="M320 80 L320 160" stroke-width="3.5" stroke="#C9462C"/>
      </svg>
    </div>
    <div>
      <div class="feature-eyebrow">Slow reading</div>
      <h2 class="feature-title">A quieter way to read Ghanaian music.</h2>
      <p class="feature-body">No flashing comments. No screaming banners. SoundBaze strips lyric pages back to the words — Twi, Ga, Hausa, Pidgin, English — and the people who care enough to break them down.</p>
      <div style="margin-top: 20px;">
        <a href="/about" class="btn btn-ghost">Read the manifesto →</a>
      </div>
    </div>
  </div>

  <!-- Feature row 2 (reversed) -->
  <div class="feature-row" style="direction: rtl;">
    <div class="feature-art" style="direction: ltr; background: var(--charcoal-brown); color: var(--floral-white);">
      <div style="max-width: 320px;">
        <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.12em; color: var(--paprika-tint-2);">Annotation · 1 of 2</div>
        <div style="font-size: 20px; font-weight: 500; font-style: italic; margin-top: 12px; opacity: 0.92;">"counting the cracks in the ceiling"</div>
        <div style="font-size: 14px; line-height: 1.55; margin-top: 14px; opacity: 0.85;">A direct echo of the second track on her debut EP — same image, six years later, but now it's exhaustion rather than wonder.</div>
        <div style="font-size: 12px; margin-top: 20px; opacity: 0.65;">by @ama_acc · 412 ↑</div>
      </div>
    </div>
    <div style="direction: ltr;">
      <div class="feature-eyebrow">Annotations</div>
      <h2 class="feature-title">Tap a line.<br/>Hear the room.</h2>
      <p class="feature-body">Every highlighted line opens a quiet panel — context from contributors who've sat with the song longer than most. With inline translations when the line switches languages mid-bar.</p>
      <div style="margin-top: 20px;">
        <a href="/about#annotations" class="btn btn-ghost">How annotations work →</a>
      </div>
    </div>
  </div>
</section>

<div class="kente-band"></div>

<!-- ── Community feed ────────────────────────────────────────────────────── -->
<section class="container section">
  <div class="section-head">
    <div>
      <div class="eyebrow" style="margin-bottom: 6px;">Right now</div>
      <h2 class="section-title">The community is reading</h2>
    </div>
  </div>
  <div class="contrib-list">
    {#each community as entry}
      <div class="contrib-row">
        <div class="avatar" style="width: 36px; height: 36px;">{entry.avatar}</div>
        <div class="contrib-body">
          <strong>@{entry.author}</strong> {entry.action}
          <em>"{entry.line}"</em> on <strong>{entry.song}</strong>
        </div>
        {#if entry.upvotes > 0}
          <span class="pill pill-neutral">↑ {entry.upvotes}</span>
        {/if}
        <span class="contrib-time">{entry.time}</span>
      </div>
    {/each}
  </div>
</section>
