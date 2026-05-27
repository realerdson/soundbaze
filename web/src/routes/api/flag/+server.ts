import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /api/flag
 * Body: { annotation_id: string }
 *
 * Increments flagged_count, records this user's flag (once only),
 * and auto-moves the annotation to 'flagged' status at 3+ flags.
 * Requires authentication.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.user) throw error(401, 'Sign in to flag annotations.');

  const raw = await request.json().catch(() => null);
  const annotationId = raw?.annotation_id;
  if (!annotationId || typeof annotationId !== 'string') {
    throw error(400, 'annotation_id is required.');
  }

  // Fetch current flag state
  const { data: ann, error: fetchErr } = await locals.supabase
    .from('annotations')
    .select('flagged_by, flagged_count, status')
    .eq('id', annotationId)
    .single();

  if (fetchErr || !ann) throw error(404, 'Annotation not found.');

  const userId = locals.user.id;
  const alreadyFlagged = ((ann.flagged_by ?? []) as string[]).includes(userId);

  // Idempotent — silently succeed if already flagged
  if (alreadyFlagged) {
    return json({ ok: true, already: true, flagged_count: ann.flagged_count ?? 0 });
  }

  const newFlaggedBy    = [...(ann.flagged_by ?? []), userId];
  const newFlaggedCount = (ann.flagged_count ?? 0) + 1;
  // Auto-move to 'flagged' status at 3 unique user flags (threshold)
  const newStatus = newFlaggedCount >= 3 && ann.status === 'approved'
    ? 'flagged'
    : ann.status;

  const { error: updateErr } = await locals.supabase
    .from('annotations')
    .update({
      flagged_by:    newFlaggedBy,
      flagged_count: newFlaggedCount,
      status:        newStatus,
    })
    .eq('id', annotationId);

  if (updateErr) throw error(500, updateErr.message);

  return json({ ok: true, flagged_count: newFlaggedCount });
};
