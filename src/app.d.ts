/**
 * SvelteKit App Type Declarations
 *
 * Defines the shape of data available throughout the application.
 * @see https://svelte.dev/docs/kit/types#app.d.ts
 */

import type { Locale, User } from '$lib/types/index.js';

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}

		/**
		 * Locals available in hooks and server-side code.
		 * Populated by `src/hooks.server.ts`.
		 */
		interface Locals {
			/** Current locale (from cookie or Accept-Language header) */
			locale: Locale;
			/** Current user profile if authenticated; null otherwise */
			user: User | null;
			/** Whether the current user is a system admin */
			isAdmin: boolean;
		}

		interface PageData {
			locale: Locale;
			user: User | null;
		}

		// interface PageState {}
		// interface Platform {}
	}
}

export {};
