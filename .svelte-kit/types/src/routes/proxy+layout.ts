// @ts-nocheck
/**
 * Root Layout Client Load
 *
 * Forwards server-side load data to the layout. Local auth requires no
 * client-side session client — `locals.user` is read on every request.
 */

import type { LayoutLoad } from './$types.js';

export const load = ({ data }: Parameters<LayoutLoad>[0]) => data;
