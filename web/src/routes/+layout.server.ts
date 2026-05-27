import type { LayoutServerLoad } from './$types';

/**
 * Passes the authenticated user to every page via $page.data.user.
 * The layout uses this to show "Sign in" vs. the profile avatar in the nav.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  return { user: locals.user };
};
