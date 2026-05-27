import type { PageServerLoad } from './$types';
import { SONGS, COMMUNITY } from '$lib/data';

export const load: PageServerLoad = async ({ locals }) => {
  // ── Supabase: trending songs + recent community activity ─────────────────
  if (locals.supabase) {
    const [songsRes, activityRes] = await Promise.all([
      locals.supabase
        .from('songs')
        .select('id, title, slug, artist_name, cover_url, annotation_count, pageviews')
        .order('pageviews', { ascending: false })
        .limit(8),
      locals.supabase
        .from('annotations')
        .select(`
          id, created_at, upvotes,
          profiles ( username, avatar_url ),
          songs    ( title, slug )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    const songs = (songsRes.data ?? []).map(s => ({
      id:              s.id,
      title:           s.title,
      artist:          s.artist_name,
      artistId:        '',
      album:           '',
      year:            0,
      duration:        '',
      cover:           s.cover_url ?? '',
      annotationCount: s.annotation_count ?? 0,
      reads:           s.pageviews ? `${Math.round(s.pageviews / 1000)}K` : '0',
    }));

    const community = (activityRes.data ?? []).map(a => {
      const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      const song    = Array.isArray(a.songs)    ? a.songs[0]    : a.songs;
      return {
        author:   profile?.username ?? 'anonymous',
        avatar:   (profile?.username?.[0] ?? '?').toUpperCase(),
        action:   'annotated',
        song:     song?.title ?? '',
        line:     '—',
        time:     relativeTime(a.created_at),
        upvotes:  a.upvotes ?? 0,
      };
    });

    if (songs.length > 0) return { songs, community };
  }

  // ── Mock fallback ─────────────────────────────────────────────────────────
  return { songs: SONGS, community: COMMUNITY };
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1)  return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
