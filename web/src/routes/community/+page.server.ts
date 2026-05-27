import type { PageServerLoad } from './$types';
import { COMMUNITY } from '$lib/data';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.supabase) {
    const [activityRes, leaderboardRes] = await Promise.all([
      // Recent approved annotations with author + song info
      locals.supabase
        .from('annotations')
        .select(`
          id, body, created_at, upvotes,
          profiles ( username, avatar_url ),
          songs    ( title, slug )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10),

      // Top contributors by IQ
      locals.supabase
        .from('profiles')
        .select('id, username, iq_points, avatar_url')
        .order('iq_points', { ascending: false })
        .limit(10),
    ]);

    const activity = (activityRes.data ?? []).map((a, i) => {
      const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
      const song    = Array.isArray(a.songs)    ? a.songs[0]    : a.songs;
      const diff    = Date.now() - new Date(a.created_at).getTime();
      const h       = Math.floor(diff / 3_600_000);
      const time    = h < 1 ? 'just now' : h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;

      return {
        author:   profile?.username ?? 'anonymous',
        avatar:   (profile?.username?.[0] ?? '?').toUpperCase(),
        color:    AVATAR_COLORS[i % AVATAR_COLORS.length],
        action:   'annotated' as const,
        line:     a.body?.slice(0, 60) + (a.body?.length > 60 ? '…' : ''),
        song:     song?.title ?? '',
        songId:   song?.slug  ?? '',
        time,
        upvotes:  a.upvotes ?? 0,
      };
    });

    const leaderboard = (leaderboardRes.data ?? []).map((p, i) => ({
      rank:        i + 1,
      username:    p.username,
      avatar:      (p.username?.[0] ?? '?').toUpperCase(),
      color:       AVATAR_COLORS[i % AVATAR_COLORS.length],
      iq:          p.iq_points ?? 0,
      annotations: 0,   // would need a join — add later
      badge:       i === 0 ? 'Top annotator' : i === 1 ? 'Verified writer' : '',
    }));

    if (activity.length > 0 || leaderboard.length > 0) {
      return { activity, leaderboard };
    }
  }

  // Mock fallback
  const activity = COMMUNITY.map((c, i) => ({
    ...c,
    color:  AVATAR_COLORS[i % AVATAR_COLORS.length],
    songId: c.song.toLowerCase().replace(/\s+/g, '-'),
    line:   c.line,
  }));

  const leaderboard = MOCK_LEADERBOARD;

  return { activity, leaderboard };
};

const AVATAR_COLORS = ['#826A5C', '#3D2E26', '#C9462C', '#5C463A', '#826A5C', '#3D2E26'];

const MOCK_LEADERBOARD = [
  { rank: 1, username: 'ama_acc',  avatar: 'A', color: '#826A5C', iq: 8_420, annotations: 142, badge: 'Top annotator'   },
  { rank: 2, username: 'wrenkim',  avatar: 'W', color: '#3D2E26', iq: 6_180, annotations: 97,  badge: 'Verified writer' },
  { rank: 3, username: 'kofi_ann', avatar: 'K', color: '#826A5C', iq: 4_902, annotations: 84,  badge: ''                },
  { rank: 4, username: 'araba_b',  avatar: 'A', color: '#5C463A', iq: 3_770, annotations: 61,  badge: ''                },
  { rank: 5, username: 'kweku.gh', avatar: 'K', color: '#C9462C', iq: 1_240, annotations: 18,  badge: ''                },
];
