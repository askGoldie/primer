
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/app" | "/app/admin" | "/app/admin/audit" | "/app/api" | "/app/api/audit-export" | "/app/api/placement-request" | "/app/goals" | "/app/inquiries" | "/app/inquiries/new" | "/app/inquiries/[id]" | "/app/leaders" | "/app/leaders/[id]" | "/app/onboarding" | "/app/peers" | "/app/performance" | "/app/reports" | "/app/settings" | "/app/settings/audit-log" | "/app/setup" | "/app/stack" | "/app/team" | "/app/visibility" | "/auth" | "/auth/forgot-password" | "/auth/login" | "/auth/logout" | "/auth/register" | "/auth/reset-password" | "/auth/verify-email" | "/auth/verify-email/resend" | "/favicon.ico";
		RouteParams(): {
			"/app/inquiries/[id]": { id: string };
			"/app/leaders/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/app": { id?: string };
			"/app/admin": Record<string, never>;
			"/app/admin/audit": Record<string, never>;
			"/app/api": Record<string, never>;
			"/app/api/audit-export": Record<string, never>;
			"/app/api/placement-request": Record<string, never>;
			"/app/goals": Record<string, never>;
			"/app/inquiries": { id?: string };
			"/app/inquiries/new": Record<string, never>;
			"/app/inquiries/[id]": { id: string };
			"/app/leaders": { id?: string };
			"/app/leaders/[id]": { id: string };
			"/app/onboarding": Record<string, never>;
			"/app/peers": Record<string, never>;
			"/app/performance": Record<string, never>;
			"/app/reports": Record<string, never>;
			"/app/settings": Record<string, never>;
			"/app/settings/audit-log": Record<string, never>;
			"/app/setup": Record<string, never>;
			"/app/stack": Record<string, never>;
			"/app/team": Record<string, never>;
			"/app/visibility": Record<string, never>;
			"/auth": Record<string, never>;
			"/auth/forgot-password": Record<string, never>;
			"/auth/login": Record<string, never>;
			"/auth/logout": Record<string, never>;
			"/auth/register": Record<string, never>;
			"/auth/reset-password": Record<string, never>;
			"/auth/verify-email": Record<string, never>;
			"/auth/verify-email/resend": Record<string, never>;
			"/favicon.ico": Record<string, never>
		};
		Pathname(): "/" | "/app" | "/app/admin" | "/app/admin/audit" | "/app/api/audit-export" | "/app/api/placement-request" | "/app/goals" | "/app/inquiries" | "/app/inquiries/new" | `/app/inquiries/${string}` & {} | "/app/leaders" | `/app/leaders/${string}` & {} | "/app/onboarding" | "/app/peers" | "/app/performance" | "/app/reports" | "/app/settings" | "/app/settings/audit-log" | "/app/setup" | "/app/stack" | "/app/team" | "/app/visibility" | "/auth/forgot-password" | "/auth/login" | "/auth/logout" | "/auth/register" | "/auth/reset-password" | "/auth/verify-email" | "/auth/verify-email/resend" | "/favicon.ico";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/.DS_Store" | "/favicon.svg" | "/fonts/.DS_Store" | "/fonts/inter/.DS_Store" | "/fonts/inter/inter-latin-400.woff2" | "/fonts/inter/inter-latin-500.woff2" | "/fonts/inter/inter-latin-600.woff2" | "/fonts/jetbrainsmoto/.DS_Store" | "/fonts/jetbrainsmoto/JetBrainsMono-Regular.woff2" | "/logo.png" | "/logo.svg" | "/logo.webp" | string & {};
	}
}