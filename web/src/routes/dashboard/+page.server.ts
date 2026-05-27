import type { PageServerLoad } from './$types';

/**
 * Dashboard — requires authentication (enforced in hooks.server.ts).
 * Returns the full profile + user's annotations from Supabase,
 * or mock data when running without Supabase.
 */
export const load: PageServerLoad = async ({ locals }) => {
  // hooks.server.ts already redirected unauthenticated visitors to /login
  const user = locals.user!;

  if (locals.supabase) {
    const [profileRes, annotationsRes] = await Promise.all([
      locals.supabase
        .from('profiles')
        .select('username, bio, avatar_url, iq_points, role')
        .eq('id', user.id)
        .single(),
      locals.supabase
        .from('annotations')
        .select(`
          id, body, start_idx, end_idx, upvotes, created_at,
          songs ( title, slug, artist_name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    return {
      user,
      profile:     profileRes.data   ?? null,
      annotations: annotationsRes.data ?? [],
    };
  }

  // Mock data — shown while Supabase isn't wired up yet
  return {
    user,
    profile: {
      username:   user.email?.split('@')[0] ?? 'you',
      iq_points:  0,
      role:       'contributor',
      avatar_url: null,
      bio:        null,
    },
    annotations: [],
  };
};
