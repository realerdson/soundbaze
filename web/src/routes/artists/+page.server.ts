import type { PageServerLoad } from './$types';
import { ARTISTS } from '$lib/data';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.supabase) {
    const { data } = await locals.supabase
      .from('artists')
      .select('id, name, slug, bio, image_url, follower_count, verified')
      .order('follower_count', { ascending: false });

    if (data?.length) {
      return {
        artists: data.map(a => ({
          id:        a.id,
          name:      a.name,
          slug:      a.slug ?? a.id,
          bio:       a.bio ?? '',
          cover:     a.image_url ?? '',
          followers: a.follower_count
            ? `${Math.round(a.follower_count / 1000)}K`
            : '—',
          verified: a.verified ?? false,
        })),
      };
    }
  }

  // Mock fallback
  return {
    artists: Object.values(ARTISTS).map(a => ({
      id:        a.id,
      name:      a.name,
      slug:      a.id,
      bio:       a.bio,
      cover:     a.cover,
      followers: a.followers,
      verified:  false,
    })),
  };
};
