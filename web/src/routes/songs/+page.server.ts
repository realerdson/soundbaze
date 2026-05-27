import type { PageServerLoad } from './$types';
import { SONGS } from '$lib/data';

const GENRES = ['All', 'Hiplife', 'Drill', 'Alté', 'Gospel highlife', 'Afropop'];

export const load: PageServerLoad = async ({ locals, url }) => {
  const genre = url.searchParams.get('genre') ?? 'All';
  const sort  = (url.searchParams.get('sort') ?? 'popular') as 'popular' | 'recent' | 'annotations';

  if (locals.supabase) {
    let query = locals.supabase
      .from('songs')
      .select('id, title, slug, artist_name, cover_url, annotation_count, pageviews, genre, release_year');

    if (genre !== 'All') query = query.eq('genre', genre);

    if (sort === 'recent')      query = query.order('release_year',     { ascending: false });
    else if (sort === 'annotations') query = query.order('annotation_count', { ascending: false });
    else                        query = query.order('pageviews',         { ascending: false });

    const { data } = await query.limit(50);

    if (data?.length) {
      return {
        songs: data.map(s => ({
          id:              s.id,
          title:           s.title,
          artist:          s.artist_name,
          cover:           s.cover_url ?? '',
          annotationCount: s.annotation_count ?? 0,
          reads:           s.pageviews ? `${Math.round(s.pageviews / 1000)}K` : '—',
          genre:           s.genre ?? '',
          year:            s.release_year ?? 0,
        })),
        genres: GENRES,
        activeGenre: genre,
        activeSort:  sort,
      };
    }
  }

  // Mock fallback
  return {
    songs: SONGS.map(s => ({ ...s, genre: '', year: s.year ?? 0 })),
    genres: GENRES,
    activeGenre: genre,
    activeSort:  sort,
  };
};
