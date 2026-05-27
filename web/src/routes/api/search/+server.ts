import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { SONGS, ARTISTS } from '$lib/data';

/**
 * GET /api/search?q=<query>
 *
 * Returns { songs: Song[], artists: Artist[] }.
 *
 * When Supabase is configured: uses Postgres full-text search (tsvector).
 * Otherwise: falls back to in-memory search over mock data for local dev.
 */
export async function GET({ url, locals }: RequestEvent) {
  const q = url.searchParams.get('q')?.trim() ?? '';
  if (!q) return json({ songs: [], artists: [] });

  // ── Supabase full-text search ─────────────────────────────────────────────
  if (locals.supabase) {
    const [{ data: songs }, { data: artists }] = await Promise.all([
      locals.supabase
        .from('songs')
        .select('id, title, slug, artist_name, cover_url, annotation_count, reads')
        .textSearch('search_vector', q, { type: 'websearch', config: 'english' })
        .order('pageviews', { ascending: false })
        .limit(20),
      locals.supabase
        .from('artists')
        .select('id, name, slug, image_url, follower_count')
        .ilike('name', `%${q}%`)
        .limit(8),
    ]);
    return json({ songs: songs ?? [], artists: artists ?? [] });
  }

  // ── Mock fallback ─────────────────────────────────────────────────────────
  const ql = q.toLowerCase();
  const songs = SONGS.filter(s =>
    s.title.toLowerCase().includes(ql) || s.artist.toLowerCase().includes(ql)
  );
  const artists = Object.values(ARTISTS).filter(a =>
    a.name.toLowerCase().includes(ql)
  );

  return json({ songs, artists });
}
