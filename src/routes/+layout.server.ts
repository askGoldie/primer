/**
 * Root Layout Server Load
 *
 * Runs on every request. Passes locale and user to all pages via PageData.
 */

import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    locale: locals.locale,
    user: locals.user,
  };
};
