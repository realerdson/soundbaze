import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { SONGS, ARTISTS } from '$lib/data';
import type { Song } from '$lib/types';

/**
 * Compute absolute start_idx / end_idx for every annotation by walking the
 * lyric lines in order (text-only, joined with \n — exactly how the component
 * builds rawLyrics) and using the per-line `from`/`to` offsets already in the
 * mock data.  This way we never manually hardcode character positions.
 */
function enrichAnnotationOffsets(song: Song): Song {
  if (!song.lyrics || !song.annotations) return song;

  // Walk only text lines (skip section markers) to track character offsets
  let cursor = 0;
  const offsets: Record<string, { start_idx: number; end_idx: number }> = {};

  for (const line of song.lyrics) {
    if ('type' in line) continue; // section label — not in rawLyrics

    const text = ('text' in line ? line.text : '') ?? '';

    if (line.annotations) {
      for (const ref of line.annotations) {
        offsets[ref.id] = {
          start_idx: cursor + ref.from,
          end_idx:   cursor + ref.to,
        };
      }
    }

    cursor += text.length + 1; // +1 for the joining '\n'
  }

  // Merge computed offsets into annotation objects
  const enriched: typeof song.annotations = {};
  for (const [id, ann] of Object.entries(song.annotations)) {
    enriched[id] = { ...ann, ...(offsets[id] ?? {}) };
  }

  return { ...song, annotations: enriched };
}

export const load: PageServerLoad = async ({ params, locals }) => {
  // ── Supabase path (production) ─────────────────────────────────────────
  if (locals.supabase) {
    const { data: song } = await locals.supabase
      .from('songs')
      .select(`
        id, title, slug, lyrics, cover_url, genre, release_year,
        artist_name, artist_id, annotation_count, duration,
        annotations (
          id, start_idx, end_idx, body, upvotes, status,
          profiles ( username, iq_points, avatar_url )
        )
      `)
      .eq('slug', params.slug)
      .eq('annotations.status', 'approved')
      .single();

    if (song) {
      // Increment pageview — fire-and-forget, don't await
      locals.supabase.rpc('increment_pageview', { song_id: song.id });

      // Fetch artist separately
      const artistRes = song.artist_id
        ? await locals.supabase.from('artists').select('*').eq('id', song.artist_id).single()
        : { data: null };

      // Normalise Supabase annotations array → Record<id, Annotation>
      const annotationsMap: Record<string, import('$lib/types').Annotation> = {};
      for (const ann of (song.annotations ?? [])) {
        const profile = Array.isArray(ann.profiles) ? ann.profiles[0] : ann.profiles;
        annotationsMap[ann.id] = {
          id:        ann.id,
          quote:     '',   // Supabase doesn't store quote separately — derived from lyrics + offsets
          body:      ann.body,
          author:    profile?.username ?? 'anonymous',
          avatar:    (profile?.username?.[0] ?? '?').toUpperCase(),
          upvotes:   ann.upvotes ?? 0,
          start_idx: ann.start_idx,
          end_idx:   ann.end_idx,
        };
      }

      // Normalise field names to match our Song type (mock uses cover/year/artist, DB uses cover_url/release_year/artist_name)
      const normalisedSong: Song = {
        id:              song.id,
        title:           song.title,
        artist:          song.artist_name,
        artistId:        song.artist_id ?? '',
        album:           '',          // not in this query — add to select if needed
        year:            song.release_year ?? 0,
        duration:        song.duration ?? '',
        cover:           song.cover_url ?? '',
        annotationCount: song.annotation_count ?? 0,
        reads:           '',
        lyrics:          undefined,   // Supabase stores raw text; lyrics[] comes from mock only
        annotations:     annotationsMap,
      };

      return {
        song:   normalisedSong,
        artist: artistRes.data ?? null,
        user:   locals.user,
      };
    }
    // If not found in Supabase, fall through to mock (useful during seeding)
  }

  // ── Mock data fallback (local dev / pre-seeded DB) ────────────────────
  const raw = SONGS.find((s) => s.id === params.slug);
  if (!raw) throw error(404, 'Song not found');

  const song   = enrichAnnotationOffsets(raw);
  const artist = song.artistId ? ARTISTS[song.artistId] : null;

  return { song, artist, user: locals.user };
};
