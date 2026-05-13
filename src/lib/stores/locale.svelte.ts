/**
 * Locale Store
 *
 * Manages the current locale state for the application.
 * Uses Svelte 5 runes for reactivity.
 */

import type { Locale } from "$lib/types/index.js";
import { setLocaleCookie, DEFAULT_LOCALE } from "$lib/i18n/index.js";

/**
 * Create a locale store with Svelte 5 runes
 */
function createLocaleStore() {
  let current = $state<Locale>(DEFAULT_LOCALE);

  return {
    get current() {
      return current;
    },
    set(locale: Locale) {
      current = locale;
      setLocaleCookie(locale);
    },
  };
}

export const localeStore = createLocaleStore();
