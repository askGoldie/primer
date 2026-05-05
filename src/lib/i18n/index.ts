/**
 * Internationalization (i18n) System for Primer
 *
 * All user-facing strings are externalized into locale JSON files.
 * No hardcoded English strings in any .svelte file or +page.svelte.
 *
 * @see /docs/multilingual-implementation-spec.md
 */

import type { Locale } from '$lib/types/index.js';
import { browser } from '$app/environment';

// Import all locale files
import en from './en.json' with { type: 'json' };
import zh from './zh.json' with { type: 'json' };
import es from './es.json' with { type: 'json' };
import ar from './ar.json' with { type: 'json' };
import fr from './fr.json' with { type: 'json' };
import de from './de.json' with { type: 'json' };
import ja from './ja.json' with { type: 'json' };
import pt from './pt.json' with { type: 'json' };
import ko from './ko.json' with { type: 'json' };

/**
 * All loaded locale data
 */
const locales: Record<Locale, Record<string, string>> = {
	en,
	zh,
	es,
	ar,
	fr,
	de,
	ja,
	pt,
	ko
};

/**
 * Default locale
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Cookie name for storing language preference
 */
export const LOCALE_COOKIE_NAME = 'primer_lang';

/**
 * Get a translated string by key
 *
 * @param locale - The current locale
 * @param key - The translation key (dot-namespaced, e.g., "nav.home")
 * @param vars - Optional variables for interpolation (e.g., { total: 100 })
 * @returns The translated string with variables interpolated
 *
 * @example
 * t('en', 'demo.weight_total', { total: 85 }) // "Total: 85%"
 */
export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
	// Try to get the string from the requested locale
	let str = locales[locale]?.[key];

	// Fall back to English if not found
	if (!str && locale !== 'en') {
		str = locales.en[key];
	}

	// If still not found, return the key (this is a build error in production)
	if (!str) {
		console.warn(`Missing translation key: ${key}`);
		return key;
	}

	// Interpolate variables
	if (vars) {
		for (const [varName, value] of Object.entries(vars)) {
			str = str.replace(new RegExp(`\\{${varName}\\}`, 'g'), String(value));
		}
	}

	return str;
}

/**
 * Parse Accept-Language header to find the best matching locale
 *
 * @param acceptLanguage - The Accept-Language header value
 * @returns The best matching supported locale
 */
export function parseAcceptLanguage(acceptLanguage: string | null): Locale {
	if (!acceptLanguage) return DEFAULT_LOCALE;

	// Parse the header into language-quality pairs
	const languages = acceptLanguage
		.split(',')
		.map((lang) => {
			const [code, quality] = lang.trim().split(';q=');
			return {
				code: code.toLowerCase().split('-')[0], // Get primary language code
				quality: quality ? parseFloat(quality) : 1.0
			};
		})
		.sort((a, b) => b.quality - a.quality);

	// Find the first matching supported locale
	for (const { code } of languages) {
		if (code in locales) {
			return code as Locale;
		}
	}

	return DEFAULT_LOCALE;
}

/**
 * Get locale from cookie value
 *
 * @param cookieValue - The cookie value
 * @returns The locale if valid, null otherwise
 */
export function getLocaleFromCookie(cookieValue: string | undefined): Locale | null {
	if (!cookieValue) return null;
	if (cookieValue in locales) {
		return cookieValue as Locale;
	}
	return null;
}

/**
 * Set locale cookie (client-side only)
 *
 * @param locale - The locale to set
 */
export function setLocaleCookie(locale: Locale): void {
	if (!browser) return;

	const expires = new Date();
	expires.setFullYear(expires.getFullYear() + 1);

	document.cookie = `${LOCALE_COOKIE_NAME}=${locale};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Get all translation keys (for validation)
 */
export function getAllKeys(): string[] {
	return Object.keys(locales.en);
}

/**
 * Validate that all locales have all keys from English
 * This runs at build time
 */
export function validateLocales(): { valid: boolean; errors: string[] } {
	const errors: string[] = [];
	const enKeys = Object.keys(locales.en);

	for (const [locale, translations] of Object.entries(locales)) {
		if (locale === 'en') continue;

		for (const key of enKeys) {
			if (!(key in translations)) {
				errors.push(`Missing key "${key}" in locale "${locale}"`);
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

export { locales };
