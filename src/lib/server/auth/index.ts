/**
 * Authentication Utilities for Primer
 *
 * Handles session management, password hashing, and token generation.
 * All authentication is email/password based (no OAuth at launch).
 */

import { db } from '$lib/server/db.js';
import { createHash, randomBytes, timingSafeEqual, scrypt } from 'crypto';
import type { Cookies } from '@sveltejs/kit';

/**
 * Session cookie name
 */
export const SESSION_COOKIE_NAME = 'primer_session';

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
	const salt = randomBytes(16).toString('hex');
	const hash = await scryptAsync(password, salt);
	return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
	const [salt, hash] = storedHash.split(':');
	if (!salt || !hash) return false;

	const computedHash = await scryptAsync(password, salt);
	const storedHashBuffer = Buffer.from(hash, 'hex');
	const computedHashBuffer = Buffer.from(computedHash, 'hex');

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
			else resolve(derivedKey.toString('hex'));
		});
	});
}

/**
 * Generate a secure random token
 */
export function generateToken(): string {
	return randomBytes(32).toString('hex');
}

/**
 * Hash a token for storage (tokens stored as hashes, not plaintext)
 */
export function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
	const sessionId = generateToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await db.from('sessions').insert({
		id: sessionId,
		user_id: userId,
		expires_at: expiresAt.toISOString()
	});

	return sessionId;
}

/**
 * Validate a session and return the user if valid
 */
export async function validateSession(sessionId: string) {
	const { data: session } = await db
		.from('sessions')
		.select('*')
		.eq('id', sessionId)
		.gt('expires_at', new Date().toISOString())
		.single();

	if (!session) return null;

	const { data: user } = await db
		.from('users')
		.select('*')
		.eq('id', session.user_id)
		.is('deactivated_at', null)
		.single();

	if (!user) return null;

	return { session, user };
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
	await db.from('sessions').delete().eq('id', sessionId);
}

/**
 * Delete all sessions for a user (e.g., after password reset)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
	await db.from('sessions').delete().eq('user_id', userId);
}

/**
 * Set session cookie
 */
export function setSessionCookie(cookies: Cookies, sessionId: string): void {
	cookies.set(SESSION_COOKIE_NAME, sessionId, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_DURATION_MS / 1000
	});
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

/**
 * Create an email verification token
 */
export async function createVerificationToken(userId: string): Promise<string> {
	const token = generateToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);

	await db.from('email_verification_tokens').insert({
		user_id: userId,
		token_hash: tokenHash,
		expires_at: expiresAt.toISOString()
	});

	return token;
}

/**
 * Verify an email verification token
 */
export async function verifyEmailToken(token: string) {
	const tokenHash = hashToken(token);

	const { data: verification } = await db
		.from('email_verification_tokens')
		.select('*')
		.eq('token_hash', tokenHash)
		.gt('expires_at', new Date().toISOString())
		.is('used_at', null)
		.single();

	if (!verification) return null;

	// Mark as used
	await db
		.from('email_verification_tokens')
		.update({ used_at: new Date().toISOString() })
		.eq('id', verification.id);

	// Mark user as verified
	await db.from('users').update({ email_verified: true }).eq('id', verification.user_id);

	return verification;
}

/**
 * Create a password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
	const token = generateToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);

	await db.from('password_reset_tokens').insert({
		user_id: userId,
		token_hash: tokenHash,
		expires_at: expiresAt.toISOString()
	});

	return token;
}

/**
 * Verify a password reset token
 */
export async function verifyPasswordResetToken(token: string) {
	const tokenHash = hashToken(token);

	const { data: resetToken } = await db
		.from('password_reset_tokens')
		.select('*')
		.eq('token_hash', tokenHash)
		.gt('expires_at', new Date().toISOString())
		.is('used_at', null)
		.single();

	return resetToken || null;
}

/**
 * Complete password reset
 */
export async function completePasswordReset(token: string, newPassword: string): Promise<boolean> {
	const resetToken = await verifyPasswordResetToken(token);
	if (!resetToken) return false;

	const passwordHash = await hashPassword(newPassword);

	// Update password and mark token as used
	await db.from('users').update({ password_hash: passwordHash }).eq('id', resetToken.user_id);
	await db
		.from('password_reset_tokens')
		.update({ used_at: new Date().toISOString() })
		.eq('id', resetToken.id);

	// Invalidate all existing sessions
	await deleteAllUserSessions(resetToken.user_id);

	return true;
}

/**
 * Validate password requirements
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
	if (password.length < MIN_PASSWORD_LENGTH) {
		return {
			valid: false,
			error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
		};
	}
	return { valid: true };
}
