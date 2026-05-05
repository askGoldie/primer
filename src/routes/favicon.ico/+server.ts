import { redirect } from '@sveltejs/kit';

/** Redirect legacy favicon.ico requests to the SVG favicon. */
export function GET() {
	redirect(301, '/favicon.svg');
}
