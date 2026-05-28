<script lang="ts">
  import { onMount } from 'svelte';
  import type { LyricLine, Annotation } from '$lib/types';

  interface Props {
    rawLyrics:    string;
    lines:        LyricLine[];
    annotations:  Record<string, Annotation>;
    activeId:     string | null;
    hasSelection: boolean;   // true while the annotation form is open — suppresses selectionchange
    onActivate:   (id: string | null) => void;
    onSelect:     (sel: { start: number; end: number; text: string } | null) => void;
  }

  let { rawLyrics, lines, annotations, activeId, hasSelection, onActivate, onSelect }: Props = $props();

  let ghostEl = $state<HTMLDivElement | null>(null);
  let debounce: ReturnType<typeof setTimeout>;

  // ── Ghost-layer index capture ─────────────────────────────────────────────
  function getIndices(): { start: number; end: number; text: string } | null {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!ghostEl || !ghostEl.contains(range.commonAncestorContainer)) return null;

    const pre = document.createRange();
    pre.selectNodeContents(ghostEl);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const end   = start + range.toString().length;
    if (start === end) return null;
    return { start, end, text: range.toString() };
  }

  function onSelectionChange() {
    // If the annotation form is already open, ignore all selection changes.
    // The textarea's autofocus fires selectionchange which would otherwise
    // immediately close the form.
    if (hasSelection) return;

    clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (hasSelection) return; // re-check after debounce
      const sel = window.getSelection();
      if (!sel?.rangeCount || sel.isCollapsed) { onSelect(null); return; }
      const node = sel.getRangeAt(0).commonAncestorContainer;
      if (!ghostEl?.contains(node)) { onSelect(null); return; }
      onSelect(getIndices());
    }, 200);
  }

  onMount(() => {
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(debounce);
    };
  });

  // ── Visible-layer render — interleaves section labels + highlighted text ──
  // Builds annotation lookup by their character offset ranges
  interface AnnEntry { id: string; start_idx: number; end_idx: number }

  function buildRendered(): string {
    // Build sorted annotation index from the full annotations map
    const annIndex: AnnEntry[] = Object.entries(annotations)
      .map(([id, a]) => ({ id, start_idx: a.start_idx ?? 0, end_idx: a.end_idx ?? 0 }))
      .filter(e => e.end_idx > e.start_idx)
      .sort((a, b) => a.start_idx - b.start_idx);

    let html   = '';
    let cursor = 0; // cursor into rawLyrics

    for (const line of lines) {
      // Section heading
      if ('type' in line && line.type === 'section') {
        html += `<div class="lyric-section">${esc(line.label ?? '')}</div>`;
        continue;
      }

      const text = 'text' in line ? (line.text ?? '') : '';
      const lineEnd = cursor + text.length;

      // Collect annotations that overlap this line
      let pos = cursor;
      let lineHtml = '';

      for (const ann of annIndex) {
        if (ann.start_idx >= lineEnd) break;
        if (ann.end_idx   <= cursor)  continue;

        const s = Math.max(ann.start_idx, cursor);
        const e = Math.min(ann.end_idx,   lineEnd);

        // Text before this annotation (within line)
        if (s > pos) lineHtml += esc(rawLyrics.slice(pos, s));

        const isActive = ann.id === activeId;
        lineHtml += `<span class="ann${isActive ? ' active' : ''}" data-ann="${ann.id}" role="button" tabindex="0">${esc(rawLyrics.slice(s, e))}</span>`;
        pos = e;
      }

      // Remaining text in line
      if (pos < lineEnd) lineHtml += esc(rawLyrics.slice(pos, lineEnd));

      html += `<span class="lyric-line">${lineHtml}</span><br>`;
      cursor = lineEnd + 1; // +1 for the \n joining lines
    }

    return html;
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const rendered = $derived(buildRendered());

  // Ghost layer click → bounding-box hit test against visible .ann spans
  // (avoids caretRangeFromPoint alignment issues caused by section headers
  //  existing in the visible layer but not in the ghost layer)
  function handleGhostClick(e: MouseEvent) {
    const { clientX: cx, clientY: cy } = e;

    // Walk every annotation span rendered in the visible layer
    const spans = document.querySelectorAll<HTMLElement>('.lyrics-visible .ann[data-ann]');
    for (const span of spans) {
      const r = span.getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        const id = span.dataset.ann ?? null;
        onActivate(activeId === id ? null : id);
        return;
      }
    }
    // Clicked outside any annotation — deselect
    onActivate(null);
  }
</script>

<div class="lyric-card">
  <!-- position:relative is inlined as a failsafe — scoped CSS can be unreliable
       when the same class (.lyric-card) is also defined globally in app.css -->
  <div class="lyrics-stack" style="position: relative;">

    <!-- Ghost layer: raw text only — captures selection & clicks, invisible to user -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="lyrics-ghost"
      style="position: absolute; inset: 0; z-index: 2; color: transparent; background: transparent; cursor: text; user-select: text; -webkit-user-select: text; white-space: pre-wrap; word-break: break-word; font-size: inherit; line-height: inherit; font-family: inherit;"
      bind:this={ghostEl}
      onclick={handleGhostClick}
      aria-hidden="true"
    >{rawLyrics}</div>

    <!-- Visible layer: section labels + highlighted lyrics (display only, no events) -->
    <div class="lyrics-visible" style="position: relative; z-index: 1; pointer-events: none; white-space: pre-wrap; word-break: break-word;">
      {@html rendered}
    </div>

  </div>
</div>

<style>
  .lyric-card {
    background: var(--bg-elevated);
    border-radius: var(--radius-xl);
    padding: 40px 48px;
    box-shadow: var(--shadow-sm);
    font-size: 19px;
    line-height: 1.65;
    color: var(--fg);
    min-height: 200px;
  }

  .lyrics-stack { position: relative; }

  /* Ghost: same font/size/wrap as visible, but invisible — captures selection */
  .lyrics-ghost {
    position: absolute;
    inset: 0;
    z-index: 2;
    color: transparent;
    background: transparent;
    cursor: text;
    user-select: text;
    -webkit-user-select: text;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: inherit;
    line-height: inherit;
    font-family: inherit;
    /* Section labels don't exist in rawLyrics, so ghost height < visible height.
       We overlay only for selection; no strict pixel-alignment needed. */
  }

  /* Visible: pointer events off by default, on for annotation spans */
  .lyrics-visible {
    position: relative;
    z-index: 1;
    pointer-events: none;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .lyrics-visible :global(.lyric-section) {
    display: block;
    pointer-events: none;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--accent);
    margin: 28px 0 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--divider);
  }
  .lyrics-visible :global(.lyric-section:first-child) { margin-top: 0; }

  .lyrics-visible :global(.lyric-line) {
    display: inline;
  }

  .lyrics-visible :global(.ann) {
    background: var(--annotation-bg);
    border-bottom: 2px solid var(--annotation-marker);
    padding: 0 3px;
    border-radius: 2px;
    cursor: pointer;
    transition: background 140ms var(--ease-out);
  }
  .lyrics-visible :global(.ann:hover)  { background: var(--annotation-bg-hover); }
  .lyrics-visible :global(.ann.active) { background: var(--annotation-marker); color: var(--accent-fg, #FAF6EE); }

  @media (max-width: 640px) {
    .lyric-card { padding: 24px 20px; font-size: 17px; }
  }
</style>
