import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * POST /auth/signout
 *
 * Signs the user out by clearing the Supabase session cookie, then redirects
 * to home.  Use a <form method="POST"> button — never a plain <a> link — so
 * sign-out can't be triggered by a CSRF-crafted URL.
 */
export const POST: RequestHandler = async ({ locals }) => {
  if (locals.supabase) {
    await locals.supabase.auth.signOut();
  }
  throw redirect(303, '/');
};
