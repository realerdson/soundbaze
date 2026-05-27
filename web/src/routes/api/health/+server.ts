import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';

/**
 * GET /api/health
 *
 * Lightweight health check.  Used by the Supabase keep-alive ping cron job
 * and by Cloudflare health monitoring.  Always returns 200.
 */
export async function GET({ locals }: RequestEvent) {
  if (locals.supabase) {
    const start = Date.now();
    const { error } = await locals.supabase.from('songs').select('id').limit(1);
    return json({
      ok:      !error,
      db:      error ? 'error' : 'ok',
      db_ms:   Date.now() - start,
      ts:      Date.now(),
    });
  }
  return json({ ok: true, db: 'mock', ts: Date.now() });
}
