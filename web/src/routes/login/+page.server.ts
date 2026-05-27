import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/**
 * If the user is already signed in, forward them straight to the dashboard.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
  if (locals.user) {
    const next = url.searchParams.get('next') ?? '/dashboard';
    throw redirect(303, next.startsWith('/') ? next : '/dashboard');
  }
  // Pass through any error or next-destination params to the page
  return {
    error: url.searchParams.get('error') ?? null,
    next:  url.searchParams.get('next')  ?? '/dashboard',
  };
};
