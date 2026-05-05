/**
 * SvelteKit App Type Declarations
 *
 * Defines the shape of data available throughout the application.
 * @see https://svelte.dev/docs/kit/types#app.d.ts
 */

import type { Locale, User } from '$lib/types/index.js';
import type { Session, SupabaseClient } from '@supabase/supabase-js';

declare global {
	namespace App {
		/**
		 * Error interface for error handling
		 */
		interface Error {
			message: string;
			code?: string;
		}

		/**
		 * Locals available in hooks and server-side code
		 */
		interface Locals {
			/** Current locale (from cookie or Accept-Language header) */
			locale: Locale;
			/**
			 * Per-request Supabase client (official @supabase/ssr pattern).
			 * Created in hooks.server.ts and reusable across load functions.
			 */
			supabase: SupabaseClient;
			/**
			 * Validated session helper. Calls getSession() then getUser() to
			 * verify the JWT against the Supabase Auth server before trusting it.
			 * Always use this — never getSession() alone — for auth decisions.
			 */
			safeGetSession: () => Promise<{
				session: Session | null;
				user: import('@supabase/supabase-js').User | null;
			}>;
			/** Supabase session if authenticated (null for unauthenticated and perspective-cookie users) */
			session: Session | null;
			/** Current user profile if authenticated (populated from our users table) */
			user: User | null;
			/** Whether the user is a platform admin (for /admin routes) */
			isAdmin: boolean;
			/**
			 * True only when the user authenticated via Supabase Auth (JWT validated).
			 * False for demo persona sessions (primer_perspective cookie only).
			 * Use this — not `user` — to gate routes that require real Supabase login.
			 */
			isSupabaseAuthenticated: boolean;
		}

		interface PageData {
			/** Current locale for translations */
			locale: Locale;
			/** Current user if authenticated */
			user: User | null;
			/** Supabase session — available site-wide from root layout.server.ts */
			session: Session | null;
		}

		// interface PageState {}
		// interface Platform {}
	}
}

export {};
