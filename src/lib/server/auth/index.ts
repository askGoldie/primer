/**
 * Authentication Utilities for Primer
 *
 * Handles session management, password hashing, and token generation.
 * All authentication is email/password based (no OAuth at launch).
 */

import { sql, maybeOne } from "$lib/server/db.js";
import { createHash, randomBytes, timingSafeEqual, scrypt } from "crypto";
import type { Cookies } from "@sveltejs/kit";

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  locale: string | null;
  is_admin: boolean | null;
  email_verified: boolean | null;
  deactivated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface VerificationTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
}

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = "primer_session";

/**
 * Session duration in milliseconds (7 days)
 */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Verification token expiry (24 hours)
 */
export const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/**
 * Password reset token expiry (1 hour)
 */
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000;

/**
 * Minimum password length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Hash a password using scrypt
 * Format: salt:hash (both hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt);
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const computedHash = await scryptAsync(password, salt);
  const storedHashBuffer = Buffer.from(hash, "hex");
  const computedHashBuffer = Buffer.from(computedHash, "hex");

  if (storedHashBuffer.length !== computedHashBuffer.length) return false;
  return timingSafeEqual(storedHashBuffer, computedHashBuffer);
}

/**
 * Scrypt async wrapper
 */
async function scryptAsync(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err: Error | null, derivedKey: Buffer) => {
      if (err) reject(err);
      else resolve(derivedKey.toString("hex"));
    });
  });
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a token for storage (tokens stored as hashes, not plaintext)
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await sql`
		insert into sessions (id, user_id, expires_at)
		values (${sessionId}, ${userId}, ${expiresAt.toISOString()})
	`;

  return sessionId;
}

/**
 * Validate a session and return the user if valid
 */
export async function validateSession(
  sessionId: string,
): Promise<{ session: SessionRow; user: UserRow } | null> {
  const session = await maybeOne<SessionRow>(sql`
		select * from sessions
		where id = ${sessionId} and expires_at > now()
	`);

  if (!session) return null;

  const user = await maybeOne<UserRow>(sql`
		select * from users
		where id = ${session.user_id} and deactivated_at is null
	`);

  if (!user) return null;

  return { session, user };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await sql`delete from sessions where id = ${sessionId}`;
}

/**
 * Delete all sessions for a user (e.g., after password reset)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await sql`delete from sessions where user_id = ${userId}`;
}

/**
 * Whether to mark the session cookie `Secure`. Browsers reject Secure
 * cookies sent over plain http, which breaks evaluation deployments on
 * `http://localhost`. Inferred from `PUBLIC_APP_URL` so production
 * (https) keeps Secure while local Docker Compose stays usable.
 */
const SECURE_COOKIES = (process.env.PUBLIC_APP_URL ?? "").startsWith(
  "https://",
);

/**
 * Set session cookie
 */
export function setSessionCookie(cookies: Cookies, sessionId: string): void {
  cookies.set(SESSION_COOKIE_NAME, sessionId, {
    path: "/",
    httpOnly: true,
    secure: SECURE_COOKIES,
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
}

/**
 * Create an email verification token
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

  await sql`
		insert into email_verification_tokens (user_id, token_hash, expires_at)
		values (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
	`;

  return token;
}

/**
 * Verify an email verification token
 */
export async function verifyEmailToken(
  token: string,
): Promise<VerificationTokenRow | null> {
  const tokenHash = hashToken(token);

  const verification = await maybeOne<VerificationTokenRow>(sql`
		select * from email_verification_tokens
		where token_hash = ${tokenHash}
			and expires_at > now()
			and used_at is null
	`);

  if (!verification) return null;

  await sql`update email_verification_tokens set used_at = now() where id = ${verification.id}`;
  await sql`update users set email_verified = true where id = ${verification.user_id}`;

  return verification;
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(
  userId: string,
): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

  await sql`
		insert into password_reset_tokens (user_id, token_hash, expires_at)
		values (${userId}, ${tokenHash}, ${expiresAt.toISOString()})
	`;

  return token;
}

/**
 * Verify a password reset token
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<VerificationTokenRow | null> {
  const tokenHash = hashToken(token);

  return maybeOne<VerificationTokenRow>(sql`
		select * from password_reset_tokens
		where token_hash = ${tokenHash}
			and expires_at > now()
			and used_at is null
	`);
}

/**
 * Complete password reset
 */
export async function completePasswordReset(
  token: string,
  newPassword: string,
): Promise<boolean> {
  const resetToken = await verifyPasswordResetToken(token);
  if (!resetToken) return false;

  const passwordHash = await hashPassword(newPassword);

  await sql`update users set password_hash = ${passwordHash} where id = ${resetToken.user_id}`;
  await sql`update password_reset_tokens set used_at = now() where id = ${resetToken.id}`;

  await deleteAllUserSessions(resetToken.user_id);

  return true;
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }
  return { valid: true };
}
