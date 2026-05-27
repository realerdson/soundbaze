import { createServerClient } from '@supabase/ssr';
import { redirect, error }   from '@sveltejs/kit';
import type { Handle }       from '@sveltejs/kit';
import { rateLimit, RATE_LIMITS } from '$lib/rate-limit';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const SUPABASE_ON   = Boolean(SUPABASE_URL && SUPABASE_ANON);

/** Routes that require an authenticated session */
const PROTECTED = ['/dashboard', '/api/annotations', '/api/votes'];

export const handle: Handle = async ({ event, resolve }) => {
  // ── 1. Attach Supabase client ─────────────────────────────────────────────
  if (SUPABASE_ON) {
    event.locals.supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON!, {
      cookies: {
        get:    (key: string)         => event.cookies.get(key),
        set:    (key: string, val: string, o: object) =>
          event.cookies.set(key, val, { ...(o as Parameters<typeof event.cookies.set>[2]), path: '/' }),
        remove: (key: string, o: object) =>
          event.cookies.delete(key, { ...(o as Parameters<typeof event.cookies.delete>[1]), path: '/' }),
      },
    });

    // Validate JWT server-side — never trust client-side session alone
    const { data: { user } } = await event.locals.supabase.auth.getUser();
    event.locals.user = user ?? null;
  } else {
    event.locals.user = null;
  }

  // ── 2. Rate limiting (Cloudflare KV — no-op when KV is absent) ───────────
  const kv   = (event.platform as { env?: { RATE_LIMIT_KV?: KVNamespace } } | undefined)?.env?.RATE_LIMIT_KV;
  const path = event.url.pathname;

  if (kv && ['POST', 'PUT', 'DELETE'].includes(event.request.method)) {
    const config = Object.entries(RATE_LIMITS).find(([route]) => path.startsWith(route))?.[1];
    if (config) {
      const ip  = event.request.headers.get('CF-Connecting-IP') ?? 'unknown';
      const uid = event.locals.user?.id ?? ip;
      const result = await rateLimit({ key: `${path}:${uid}`, kv, ...config });

      if (!result.ok) {
        throw error(429, 'Too many requests — slow down, charley.');
      }
      event.setHeaders({ 'X-RateLimit-Remaining': String(result.remaining) });
    }
  }

  // ── 3. Route guards ───────────────────────────────────────────────────────
  const isProtected = PROTECTED.some(p => path.startsWith(p));
  if (isProtected && !event.locals.user) {
    throw redirect(303, `/login?next=${encodeURIComponent(path)}`);
  }

  return resolve(event);
};

export const handleError = ({
  error: err,
  event,
}: {
  error: unknown;
  event: Parameters<Handle>[0]['event'];
}) => {
  const e = err as Error;
  console.error(JSON.stringify({
    level:   'error',
    path:    event.url.pathname,
    method:  event.request.method,
    message: e?.message ?? String(err),
    user:    event.locals.user?.id ?? 'anonymous',
    ts:      new Date().toISOString(),
  }));
  return { message: 'Something went wrong. We\'ve been notified.' };
};
