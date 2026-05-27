<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  const activity    = $derived(data.activity    ?? []);
  const leaderboard = $derived(data.leaderboard ?? []);
</script>

<svelte:head>
  <title>Community · SoundBaze</title>
</svelte:head>

<!-- Header -->
<section style="background: var(--bg-elevated); border-bottom: 1px solid var(--border); padding: 48px 0 36px;">
  <div class="container">
    <div class="eyebrow" style="margin-bottom: 10px;">Right now</div>
    <h1 style="font-size: 42px; font-weight: 700; letter-spacing: -0.025em; margin-bottom: 10px;">The community is reading</h1>
    <p style="font-size: 17px; color: var(--fg-muted); max-width: 560px; line-height: 1.55;">
      Every annotation you write earns IQ. Every upvote you give helps a good read surface. Charley, that's how we build this thing together.
    </p>
  </div>
</section>

<div class="kente-band"></div>

<div class="container" style="padding: 48px 0 80px;">
  <div class="community-grid">

    <!-- Activity feed -->
    <div>
      <div class="section-head" style="margin-bottom: 20px;">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px;">Live feed</div>
          <h2 class="section-title">Recent annotations</h2>
        </div>
      </div>
      <div class="contrib-list">
        {#each activity as item}
          <div class="contrib-row">
            <div class="avatar" style="width: 38px; height: 38px; font-size: 14px; background: {item.color}; flex-shrink: 0;">
              {item.avatar}
            </div>
            <div class="contrib-body" style="flex: 1;">
              <strong>@{item.author}</strong>
              {item.action === 'annotated' ? ' annotated ' : ' saved '}
              {#if item.line !== '—'}
                <em>"{item.line}"</em> on
              {/if}
              <a href="/songs/{item.songId}" style="font-weight: 600; color: var(--fg);">{item.song}</a>
            </div>
            {#if item.upvotes > 0}
              <span class="pill pill-neutral" style="flex-shrink: 0;">↑ {item.upvotes}</span>
            {/if}
            <span class="contrib-time">{item.time}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Leaderboard -->
    <div>
      <div class="section-head" style="margin-bottom: 20px;">
        <div>
          <div class="eyebrow" style="margin-bottom: 6px;">This month</div>
          <h2 class="section-title">Top contributors</h2>
        </div>
        <a href="/leaderboard" style="font-size: 14px; color: var(--accent); text-decoration: none;">Full board →</a>
      </div>

      <div class="leader-list">
        {#each leaderboard as person}
          <a href="/dashboard" class="leader-row">
            <span class="leader-rank" class:gold={person.rank === 1} class:silver={person.rank === 2} class:bronze={person.rank === 3}>
              {person.rank}
            </span>
            <div class="avatar" style="width: 42px; height: 42px; font-size: 15px; background: {person.color}; flex-shrink: 0;">
              {person.avatar}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 15px; font-weight: 600; color: var(--fg);">@{person.username}</div>
              <div style="font-size: 13px; color: var(--fg-subtle); margin-top: 2px;">{person.annotations} annotations</div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div style="font-size: 18px; font-weight: 700; color: var(--fg); letter-spacing: -0.02em;">{person.iq.toLocaleString()}</div>
              <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--fg-subtle);">IQ</div>
            </div>
          </a>
        {/each}
      </div>

      <!-- Join CTA -->
      <div class="join-cta">
        <div style="font-size: 17px; font-weight: 600; color: var(--fg); margin-bottom: 6px;">Want to appear here?</div>
        <p style="font-size: 14px; color: var(--fg-muted); margin-bottom: 16px; line-height: 1.5;">Sign in and start annotating. Every approved annotation earns IQ — and every upvote counts.</p>
        <a href="/login" class="btn btn-primary btn-sm btn-pill">Join SoundBaze</a>
      </div>
    </div>

  </div>
</div>

<style>
  .community-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 48px;
    align-items: start;
  }

  .leader-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .leader-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    background: var(--bg-elevated);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    text-decoration: none;
    transition: all 140ms var(--ease-out);
  }
  .leader-row:hover { box-shadow: var(--shadow-md); border-color: var(--border-strong); }

  .leader-rank {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: var(--bg-sunken);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700;
    color: var(--fg-muted);
    flex-shrink: 0;
  }
  .leader-rank.gold   { background: #FFF0C2; color: #926A00; }
  .leader-rank.silver { background: #EAEAEA; color: #555;    }
  .leader-rank.bronze { background: #FDEBD7; color: #7A3C0A; }

  .join-cta {
    margin-top: 20px;
    padding: 22px 24px;
    background: var(--bg-sunken);
    border-radius: var(--radius-lg);
    border: 1.5px dashed var(--border-strong);
  }

  @media (max-width: 860px) {
    .community-grid { grid-template-columns: 1fr; }
  }
</style>
