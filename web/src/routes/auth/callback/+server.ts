import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * OAuth + magic-link callback endpoint.
 * Supabase redirects here after the user clicks the confirmation link.
 * We exchange the one-time code for a session cookie, then forward the user
 * to their intended destination (or /dashboard by default).
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (code && locals.supabase) {
    const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Auth callback error:', error.message);
      // Redirect to login with error state rather than crashing
      throw redirect(303, '/login?error=auth_failed');
    }
  }

  // Always redirect — prevents the code from sitting in the URL bar
  throw redirect(303, next.startsWith('/') ? next : '/dashboard');
};
