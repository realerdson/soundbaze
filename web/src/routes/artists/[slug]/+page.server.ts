import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Artist, Song } from '$lib/types';
import { ARTISTS, SONGS } from '$lib/data';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return Math.round(n / 1_000) + 'K';
  return String(n);
}

export const load: PageServerLoad = async ({ params, locals }) => {
  if (locals.supabase) {
    const { data: row } = await locals.supabase
      .from('artists')
      .select('id, name, slug, bio, image_url, verified, follower_count')
      .eq('slug', params.slug)
      .maybeSingle();

    if (row) {
      // Load this artist's songs ordered by pageviews
      const { data: songRows } = await locals.supabase
        .from('songs')
        .select('id, title, slug, cover_url, release_year, annotation_count, genre, pageviews')
        .eq('artist_id', row.id)
        .order('pageviews', { ascending: false })
        .limit(10);

      const artist: Artist = {
        id:        row.slug,
        name:      row.name,
        bio:       row.bio ?? '',
        followers: formatCount(row.follower_count ?? 0),
        monthly:   '—',
        cover:     row.image_url ?? '/assets/placeholder-album-1.svg',
        topSongs:  (songRows ?? []).map((s) => s.slug ?? s.id),
      };

      const topSongs: Song[] = (songRows ?? []).map((s) => ({
        id:              s.slug ?? s.id,
        title:           s.title,
        artist:          row.name,
        artistId:        row.slug,
        album:           s.genre ?? '—',
        year:            s.release_year ?? 0,
        duration:        '—',
        cover:           s.cover_url ?? '/assets/placeholder-album-1.svg',
        annotationCount: s.annotation_count ?? 0,
        reads:           '—',
      }));

      return { artist, topSongs };
    }
  }

  // Mock fallback
  const artist = ARTISTS[params.slug];
  if (!artist) throw error(404, 'Artist not found');

  const topSongs = artist.topSongs
    .map((id) => SONGS.find((s) => s.id === id))
    .filter((s): s is Song => Boolean(s));

  return { artist, topSongs };
};
