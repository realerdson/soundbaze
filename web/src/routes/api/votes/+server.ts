import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

/**
 * POST /api/votes
 *
 * Body: { annotation_id: string, value: 1 | -1 }
 *
 * One vote per user per annotation (upsert).  Fires async IQ recalculation
 * for the annotation author.
 */
export async function POST({ request, locals }: RequestEvent) {
  if (!locals.user)     throw error(401, 'Sign in to vote');
  if (!locals.supabase) throw error(503, 'Database not available');

  const raw = await request.json().catch(() => null);
  if (!raw)             throw error(400, 'Invalid JSON body');

  const annotation_id = String(raw.annotation_id ?? '').trim();
  const value         = raw.value === -1 ? -1 : 1;   // coerce — only 1 or -1 allowed

  if (!annotation_id) throw error(400, 'annotation_id is required');

  // ── Upsert vote (unique: user + annotation) ──────────────────────────────
  const { error: dbErr } = await locals.supabase
    .from('votes')
    .upsert(
      {
        user_id:      locals.user.id,
        votable_id:   annotation_id,
        votable_type: 'annotation',
        value,
      },
      { onConflict: 'user_id,votable_id,votable_type' }
    );

  if (dbErr) throw error(500, dbErr.message);

  // ── Recalculate annotation author's IQ — non-blocking ───────────────────
  const { data: ann } = await locals.supabase
    .from('annotations').select('user_id').eq('id', annotation_id).single();
  if (ann?.user_id) {
    locals.supabase.functions.invoke('recalculate-iq', {
      body: { user_id: ann.user_id },
    });
  }

  return json({ ok: true });
}

/**
 * DELETE /api/votes
 *
 * Body: { annotation_id: string }  — removes caller's vote.
 */
export async function DELETE({ request, locals }: RequestEvent) {
  if (!locals.user)     throw error(401, 'Sign in to manage your votes');
  if (!locals.supabase) throw error(503, 'Database not available');

  const { annotation_id } = await request.json().catch(() => ({ annotation_id: null }));
  if (!annotation_id)   throw error(400, 'annotation_id is required');

  const { error: dbErr } = await locals.supabase
    .from('votes')
    .delete()
    .eq('user_id',      locals.user.id)
    .eq('votable_id',   annotation_id)
    .eq('votable_type', 'annotation');

  if (dbErr) throw error(500, dbErr.message);

  return json({ ok: true });
}
