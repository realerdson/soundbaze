import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON);

/**
 * Returns a Supabase browser client for Realtime subscriptions, OAuth flows,
 * and any client-side auth operations.  Call inside onMount — never at module
 * level to avoid SSR issues.
 */
export function getSupabaseBrowser() {
  if (!SUPABASE_CONFIGURED) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
    );
  }
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON!);
}
