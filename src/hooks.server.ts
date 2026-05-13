/**
 * Server Hooks for Primer
 *
 * Two sequential hooks (run in order via sequence()):
 *
 * 1. handleLocale  — Resolves the user's locale from cookie or Accept-Language
 *    header and substitutes %lang% / %dir% in the HTML template.
 *
 * 2. handleAuth    — Validates the primer_session cookie via the local scrypt
 *    auth helpers and populates event.locals.user / event.locals.isAdmin.
 */

import { type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";
import {
  validateSession,
  SESSION_COOKIE_NAME,
} from "$lib/server/auth/index.js";
import {
  parseAcceptLanguage,
  getLocaleFromCookie,
  LOCALE_COOKIE_NAME,
} from "$lib/i18n/index.js";
import type { Locale } from "$lib/types/index.js";

// ---------------------------------------------------------------------------
// Locale detection
// ---------------------------------------------------------------------------

const handleLocale: Handle = async ({ event, resolve }) => {
  const cookieLocale = getLocaleFromCookie(
    event.cookies.get(LOCALE_COOKIE_NAME),
  );

  if (cookieLocale) {
    event.locals.locale = cookieLocale;
  } else {
    const acceptLanguage = event.request.headers.get("accept-language");
    event.locals.locale = parseAcceptLanguage(acceptLanguage);
  }

  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const isRTL = event.locals.locale === "ar";
      return html
        .replace("%lang%", event.locals.locale)
        .replace("%dir%", isRTL ? "rtl" : "ltr");
    },
  });
};

// ---------------------------------------------------------------------------
// Auth — populate locals.user from the local session cookie
// ---------------------------------------------------------------------------

const handleAuth: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.isAdmin = false;

  const sessionId = event.cookies.get(SESSION_COOKIE_NAME);
  if (!sessionId) return resolve(event);

  try {
    const result = await validateSession(sessionId);
    if (result) {
      event.locals.user = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        locale: (result.user.locale as Locale) ?? "en",
        deactivatedAt: result.user.deactivated_at
          ? new Date(result.user.deactivated_at)
          : null,
        createdAt: new Date(result.user.created_at),
        updatedAt: new Date(result.user.updated_at),
      };
      event.locals.isAdmin = result.user.is_admin ?? false;
    }
  } catch (err) {
    // Auth failure must never cause a 500 — continue unauthenticated
    console.error("[auth hook] error:", err);
  }

  return resolve(event);
};

export const handle = sequence(handleLocale, handleAuth);
