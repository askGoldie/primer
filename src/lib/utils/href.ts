/**
 * Dynamic href helper
 *
 * `$app/paths`' `resolve()` is strongly typed against the project's generated
 * route union. That gives great type safety for statically known paths, but
 * rejects dynamic paths (e.g. `` `/app/leaders/${id}` ``, query-only URLs like
 * `?page=2`, or runtime-built hrefs) because TypeScript can't prove at the
 * call site that the string is a valid route.
 *
 * This helper is an untyped wrapper for those dynamic cases. It still calls
 * `resolve()` internally so the configured base path is applied consistently;
 * it only relaxes the compile-time type check on the argument. Prefer the
 * strongly-typed `resolve('/static/path')` for literal paths that the router
 * knows about.
 */
import { resolve } from "$app/paths";

type ResolveFn = (path: string) => string;

/**
 * Resolve a dynamic pathname string. The argument is not type-checked against
 * the route union — use only when the path is built at runtime.
 */
export const href: ResolveFn = resolve as unknown as ResolveFn;
