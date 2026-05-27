import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { sanitisePlainText } from '$lib/sanitise';

/**
 * POST /api/annotations
 *
 * Body: { song_id: string, start_idx: number, end_idx: number, body: string }
 *
 * Returns the created annotation row (201) or an error.
 */
export async function POST({ request, locals }: RequestEvent) {
  if (!locals.user)     throw error(401, 'Sign in to add an annotation');
  if (!locals.supabase) throw error(503, 'Database not available');

  const raw = await request.json().catch(() => null);
  if (!raw)             throw error(400, 'Invalid JSON body');

  const body      = sanitisePlainText(String(raw.body      ?? ''));
  const song_id   = String(raw.song_id   ?? '').trim();
  const start_idx = Number(raw.start_idx);
  const end_idx   = Number(raw.end_idx);

  // ── Validate ─────────────────────────────────────────────────────────────
  if (!body)                throw error(400, 'Annotation body is required');
  if (body.length > 2000)   throw error(400, 'Annotations must be 2 000 characters or fewer');
  if (!song_id)             throw error(400, 'song_id is required');
  if (!Number.isInteger(start_idx) || !Number.isInteger(end_idx))
                            throw error(400, 'start_idx and end_idx must be integers');
  if (start_idx < 0)        throw error(400, 'start_idx must be ≥ 0');
  if (end_idx <= start_idx) throw error(400, 'end_idx must be > start_idx');
  if (end_idx - start_idx > 500)
                            throw error(400, 'Selection is too long (max 500 characters)');

  // ── Verify song + bounds ─────────────────────────────────────────────────
  const { data: song } = await locals.supabase
    .from('songs').select('lyrics').eq('id', song_id).single();
  if (!song)                throw error(404, 'Song not found');
  if (end_idx > song.lyrics.length)
    throw error(400, `end_idx (${end_idx}) exceeds lyrics length (${song.lyrics.length})`);

  // ── Overlap guard ────────────────────────────────────────────────────────
  const { data: overlap } = await locals.supabase
    .from('annotations').select('id')
    .eq('song_id', song_id).lt('start_idx', end_idx).gt('end_idx', start_idx).limit(1);
  if (overlap?.length)
    throw error(409, 'An annotation already covers part of this selection');

  // ── Insert ───────────────────────────────────────────────────────────────
  const { data, error: dbErr } = await locals.supabase
    .from('annotations')
    .insert({ song_id, start_idx, end_idx, body, user_id: locals.user.id })
    .select().single();

  if (dbErr) throw error(500, dbErr.message);

  // Fire IQ recalculation — non-blocking, don't await
  locals.supabase.functions.invoke('recalculate-iq', {
    body: { user_id: locals.user.id },
  });

  return json(data, { status: 201 });
}
