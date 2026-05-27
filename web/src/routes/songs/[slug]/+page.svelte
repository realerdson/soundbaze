<script lang="ts">
  import { onMount }       from 'svelte';
  import type { PageData } from './$types';
  import type { Annotation } from '$lib/types';
  import LyricsViewer     from '$lib/components/LyricsViewer.svelte';
  import AnnotationForm   from '$lib/components/AnnotationForm.svelte';
  import RealtimeStatus   from '$lib/components/RealtimeStatus.svelte';
  import { SUPABASE_CONFIGURED, getSupabaseBrowser } from '$lib/supabase-browser';
  import { toast } from '$lib/toast';

  let { data }: { data: PageData } = $props();
  const song   = $derived(data.song);
  const artist = $derived(data.artist);

  // ── Annotation state ──────────────────────────────────────────────────────
  let activeId     = $state<string | null>(null);
  let selection    = $state<{ start: number; end: number; text: string } | null>(null);
  let submitError  = $state<string | null>(null);
  let submitting   = $state(false);

  // Live annotations map — seeded once from SSR, updated by Realtime subscription in onMount.
  // $state is intentionally initialized from the SSR snapshot; navigation remounts the component.
  // svelte-ignore state_referenced_locally
  let annotations = $state<Record<string, Annotation>>((song.annotations ?? {}) as Record<string, Annotation>);

  const activeAnn = $derived<Annotation | null>(
    activeId ? (annotations[activeId] ?? null) : null
  );

  function handleActivate(id: string | null) { activeId = id; }

  function handleSelect(sel: { start: number; end: number; text: string } | null) {
    selection = sel;
    submitError = null;
    if (sel) activeId = null; // clear panel while text is selected
  }

  // ── Upvote ────────────────────────────────────────────────────────────────
  let voteLoading = $state(false);
  /** IDs the current user has upvoted this session (optimistic) */
  let votedIds = $state<Set<string>>(new Set());

  async function handleUpvote(annotationId: string) {
    if (!data.user) { toast.info('Sign in to upvote annotations.'); return; }
    if (voteLoading) return;
    voteLoading = true;

    const alreadyVoted = votedIds.has(annotationId);
    // Optimistic update
    annotations = {
      ...annotations,
      [annotationId]: {
        ...annotations[annotationId],
        upvotes: (annotations[annotationId]?.upvotes ?? 0) + (alreadyVoted ? -1 : 1),
      },
    };
    if (alreadyVoted) {
      votedIds = new Set([...votedIds].filter(id => id !== annotationId));
    } else {
      votedIds = new Set([...votedIds, annotationId]);
    }

    try {
      const method = alreadyVoted ? 'DELETE' : 'POST';
      await fetch('/api/votes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotation_id: annotationId, value: 1 }),
      });
    } catch {
      // Rollback on network error
      annotations = {
        ...annotations,
        [annotationId]: {
          ...annotations[annotationId],
          upvotes: (annotations[annotationId]?.upvotes ?? 0) + (alreadyVoted ? 1 : -1),
        },
      };
    } finally {
      voteLoading = false;
    }
  }

  async function handleAnnotationSubmit(body: string) {
    if (!selection) return;
    submitting = true;
    submitError = null;

    try {
      const res = await fetch('/api/annotations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          song_id:   (song as { id?: string }).id ?? song.title, // id from Supabase, else title as stub
          start_idx: selection.start,
          end_idx:   selection.end,
          body,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message ?? `Error ${res.status}`);
      }

      // Optimistic: add the new annotation to local state immediately
      const created = await res.json();
      if (created?.id) {
        annotations = {
          ...annotations,
          [created.id]: {
            id:        created.id,
            quote:     (song as { lyrics?: unknown }).lyrics
              ? selection.text
              : selection.text,
            body:      created.body,
            author:    data.user?.email?.split('@')[0] ?? 'you',
            avatar:    (data.user?.email?.[0] ?? 'Y').toUpperCase(),
            upvotes:   0,
            start_idx: created.start_idx,
            end_idx:   created.end_idx,
          },
        };
        activeId = created.id;
      }

      selection = null;
      toast.success('Annotation live. ɛyɛ!');
    } catch (e) {
      submitError = (e as Error).message;
      toast.error(submitError ?? 'Could not submit annotation.');
    } finally {
      submitting = false;
    }
  }

  // ── Realtime subscription ─────────────────────────────────────────────────
  let realtimeStatus = $state<'idle' | 'connecting' | 'live' | 'error'>('idle');

  onMount(() => {
    if (!SUPABASE_CONFIGURED) return;

    const supabase = getSupabaseBrowser();
    const songId   = (song as { id?: string }).id;
    if (!songId) return; // mock data has no UUID — skip

    realtimeStatus = 'connecting';
    let retries = 0;

    const channel = supabase
      .channel(`song-${songId}`)
      // Live upvote count updates
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'annotations', filter: `song_id=eq.${songId}` },
        ({ new: updated }: { new: Record<string, unknown> }) => {
          const id = updated.id as string;
          if (annotations[id]) {
            annotations = {
              ...annotations,
              [id]: { ...annotations[id], upvotes: updated.upvotes as number },
            };
          }
        }
      )
      // New approved annotations appear without a page refresh
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'annotations', filter: `song_id=eq.${songId}` },
        ({ new: ann }: { new: Record<string, unknown> }) => {
          if (ann.status === 'approved' && ann.id && !annotations[ann.id as string]) {
            annotations = { ...annotations, [ann.id as string]: ann as unknown as Annotation };
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          realtimeStatus = 'live';
          retries = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeStatus = 'error';
          // Exponential backoff: max 3 retries
          if (retries < 3) {
            setTimeout(() => { retries++; channel.subscribe(); },
              Math.min(3000 * Math.pow(2, retries), 12000));
          }
        }
      });

    // Cleanup on component destroy
    return () => { channel.unsubscribe(); };
  });

  // ── Flag annotation ───────────────────────────────────────────────────────
  let flagging = $state(false);

  async function handleFlag(annotationId: string | null) {
    if (!annotationId) return;
    if (!data.user) { toast.info('Sign in to flag annotations.'); return; }
    if (flagging) return;
    flagging = true;
    try {
      const res = await fetch('/api/flag', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ annotation_id: annotationId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { already } = await res.json();
      if (already) {
        toast.info('You already flagged this annotation.');
      } else {
        toast.success('Annotation flagged. Our moderators will review it.');
        activeId = null;
      }
    } catch {
      toast.error('Could not flag annotation — try again.');
    } finally {
      flagging = false;
    }
  }

  // Raw lyrics string — text lines only, joined with \n (matches ghost layer)
  const rawLyrics = $derived(
    song.lyrics
      ? song.lyrics
          .filter((l): l is Extract<typeof l, { text: string }> => 'text' in l)
          .map((l: { text?: string }) => l.text ?? '')
          .join('\n')
      : ''
  );
</script>

<svelte:head>
  <title>{song.title} — {song.artist} · SoundBaze</title>
  <meta name="description" content="Read line-by-line annotations for {song.title} by {song.artist} — {song.annotationCount} annotations from the SoundBaze community." />

  <!-- Open Graph -->
  <meta property="og:type"        content="music.song" />
  <meta property="og:title"       content="{song.title} — {song.artist}" />
  <meta property="og:description" content="{song.annotationCount} annotations · {song.album} ({song.year})" />
  <meta property="og:image"       content={song.cover} />
  <meta property="og:site_name"   content="SoundBaze" />

  <!-- Twitter Card -->
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="{song.title} — {song.artist} · SoundBaze" />
  <meta name="twitter:description" content="{song.annotationCount} community annotations. Read the second layer." />
  <meta name="twitter:image"       content={song.cover} />
</svelte:head>

<!-- ── Song header ────────────────────────────────────────────────────────── -->
<section class="song-header">
  <div class="container song-header-inner">
    <div class="song-header-cover">
      <img src={song.cover} alt="{song.title} album art" />
    </div>
    <div>
      <div class="song-header-eyebrow">Song · annotated</div>
      <h1 class="song-header-title">{song.title}</h1>
      {#if artist}
        <a href="/artists/{song.artistId}" class="song-header-artist">{song.artist}</a>
      {:else}
        <div class="song-header-artist">{song.artist}</div>
      {/if}
      <div class="song-header-meta">
        <span>{song.album}</span><span class="dot"></span>
        <span>{song.year}</span><span class="dot"></span>
        <span>{song.duration}</span><span class="dot"></span>
        <span>{song.annotationCount} annotations</span>
      </div>
      <div class="song-header-cta">
        <button class="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          Play
        </button>
        <button class="btn btn-ghost" style="color: var(--floral-white); border-color: rgba(250,246,238,0.3);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          Save
        </button>
        <button class="icon-btn" aria-label="Share" style="color: rgba(250,246,238,0.7);">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</section>

<div class="kente-band kente-band-thick"></div>

<!-- ── Reader layout ─────────────────────────────────────────────────────── -->
<div class="reader-container">
  <div class="reader-wrap" class:reader-only={!activeAnn && !selection}>

    <!-- Lyrics with ghost-layer annotation engine -->
    {#if song.lyrics}
      <LyricsViewer
        {rawLyrics}
        lines={song.lyrics}
        {annotations}
        {activeId}
        onActivate={handleActivate}
        onSelect={handleSelect}
      />
    {:else}
      <div class="lyric-card">
        <p style="color: var(--fg-subtle); font-style: italic;">Lyrics coming soon, charley.</p>
      </div>
    {/if}

    <!-- Annotation panel / empty state -->
    {#if activeAnn}
      <aside class="ann-panel">
        <!-- Drag handle (visible on mobile only) -->
        <div class="sheet-handle" aria-hidden="true"></div>

        <div class="ann-panel-head">
          <span>Annotation</span>
          <button class="icon-btn" onclick={() => (activeId = null)} aria-label="Close" style="color: rgba(250,246,238,0.6); padding: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="ann-quote">"{activeAnn.quote}"</div>
        <div class="ann-body">{activeAnn.body}</div>
        <div class="ann-by">
          <div class="avatar" style="width: 36px; height: 36px; background: var(--accent); font-size: 14px;">{activeAnn.avatar}</div>
          <div>
            <div class="ann-by-name">@{activeAnn.author}</div>
            <div class="ann-by-meta">Top contributor</div>
          </div>
          {#if activeId}
            <button
              class="upvote-btn"
              class:upvoted={votedIds.has(activeId)}
              onclick={() => activeId && handleUpvote(activeId)}
              disabled={voteLoading}
              aria-label="Upvote this annotation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 4l8 8H4z"/>
              </svg>
              {activeAnn.upvotes}
            </button>
          {/if}
        </div>

        <!-- Flag button — available when signed in -->
        {#if data.user && activeId}
          <button
            class="flag-btn"
            onclick={() => handleFlag(activeId)}
            disabled={flagging}
            aria-label="Flag this annotation for review"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2"/>
            </svg>
            {flagging ? 'Flagging…' : 'Flag annotation'}
          </button>
        {/if}
      </aside>
    {:else if !selection}
      <div class="ann-empty">
        <strong>Nothing selected yet.</strong>
        Tap any underlined line to read what people have figured out about it — or
        highlight any line to write your own annotation.
      </div>
    {/if}

  </div>
</div>

<!-- Mobile backdrop — closes the annotation panel when tapped -->
{#if activeAnn}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="sheet-backdrop" onclick={() => (activeId = null)} role="presentation" aria-hidden="true"></div>
{/if}

<!-- Floating annotate CTA — hidden while sheet or form is open -->
{#if !selection && !activeAnn}
  <button class="float-cta" onclick={() => {
    document.querySelector('.lyrics-ghost')?.dispatchEvent(new MouseEvent('mousedown'));
  }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    Annotate a line
  </button>
{/if}

<!-- Annotation submission modal (centered on desktop, bottom sheet on mobile) -->
{#if selection}
  <AnnotationForm
    {selection}
    {submitting}
    {submitError}
    onSubmit={handleAnnotationSubmit}
    onCancel={() => { selection = null; submitError = null; }}
  />
{/if}

<!-- Realtime error boundary -->
<RealtimeStatus status={realtimeStatus} />

<style>
  .upvote-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 20px;
    border: 1.5px solid rgba(250,246,238,0.25);
    background: transparent;
    color: rgba(250,246,238,0.75);
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 140ms var(--ease-out);
  }
  .upvote-btn:hover:not(:disabled) {
    border-color: rgba(250,246,238,0.5);
    color: var(--floral-white);
  }
  .upvote-btn.upvoted {
    background: rgba(250,246,238,0.12);
    border-color: rgba(250,246,238,0.5);
    color: var(--floral-white);
  }
  .upvote-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Flag button — subtle, sits at the bottom of the annotation panel */
  .flag-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    color: rgba(250,246,238,0.35);
    font-size: 11px;
    font-family: inherit;
    cursor: pointer;
    padding: 4px 0;
    margin-top: 6px;
    transition: color 140ms var(--ease-out);
    align-self: flex-start;
  }
  .flag-btn:hover:not(:disabled) { color: rgba(250,246,238,0.7); }
  .flag-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
