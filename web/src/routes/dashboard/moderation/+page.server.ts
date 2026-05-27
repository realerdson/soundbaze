import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) throw redirect(303, '/login');

  // Verify moderator / admin role
  const { data: profile } = await locals.supabase
    .from('profiles')
    .select('role')
    .eq('id', locals.user.id)
    .single();

  if (!['moderator', 'admin'].includes(profile?.role ?? '')) {
    throw redirect(303, '/dashboard');
  }

  // Load pending annotations (oldest first — FIFO review queue)
  const { data: pending } = await locals.supabase
    .from('annotations')
    .select(`
      id, body, start_idx, end_idx, status, upvotes, created_at, user_id,
      profiles ( username, iq_points ),
      songs    ( title, slug )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  // Load flagged annotations (most-flagged first)
  const { data: flagged } = await locals.supabase
    .from('annotations')
    .select(`
      id, body, start_idx, end_idx, status, upvotes, flagged_count, created_at, user_id,
      profiles ( username, iq_points ),
      songs    ( title, slug )
    `)
    .eq('status', 'flagged')
    .order('flagged_count', { ascending: false })
    .limit(50);

  // Counts for the header badges
  const pendingCount = pending?.length  ?? 0;
  const flaggedCount = flagged?.length  ?? 0;

  return {
    pending:      pending  ?? [],
    flagged:      flagged  ?? [],
    pendingCount,
    flaggedCount,
    moderatorRole: profile?.role ?? 'moderator',
  };
};

export const actions: Actions = {
  approve: async ({ request, locals }) => {
    const form = await request.formData();
    await locals.supabase
      .from('annotations')
      .update({ status: 'approved' })
      .eq('id', String(form.get('id')));
  },

  reject: async ({ request, locals }) => {
    const form = await request.formData();
    await locals.supabase
      .from('annotations')
      .update({ status: 'rejected' })
      .eq('id', String(form.get('id')));
  },

  /**
   * Ban a user: set role='banned' + reject all their pending annotations.
   * The updated RLS policy blocks all future writes from banned users.
   */
  ban: async ({ request, locals }) => {
    const form    = await request.formData();
    const userId  = String(form.get('user_id'));
    const annotId = String(form.get('id'));

    // 1. Approve/reject the triggering annotation first
    await locals.supabase
      .from('annotations')
      .update({ status: 'rejected' })
      .eq('id', annotId);

    // 2. Reject all other pending annotations from this user
    await locals.supabase
      .from('annotations')
      .update({ status: 'rejected' })
      .eq('user_id', userId)
      .eq('status', 'pending');

    // 3. Set profile role to banned
    await locals.supabase
      .from('profiles')
      .update({ role: 'banned' })
      .eq('id', userId);
  },
};
