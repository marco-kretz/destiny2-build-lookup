import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Session } from './bungie';

const COOKIE = 'session';

// AES-256-GCM keeps the Bungie tokens unreadable and makes the cookie tamper-proof.
function key() {
	if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
	return createHash('sha256').update(env.SESSION_SECRET).digest();
}

function seal(s: Session): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key(), iv);
	const data = Buffer.concat([cipher.update(JSON.stringify(s)), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}

function unseal(raw: string): Session {
	const buf = Buffer.from(raw, 'base64url');
	const decipher = createDecipheriv('aes-256-gcm', key(), buf.subarray(0, 12));
	decipher.setAuthTag(buf.subarray(12, 28));
	return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString());
}

export function readSession(cookies: Cookies): Session | undefined {
	const raw = cookies.get(COOKIE);
	if (!raw) return undefined;
	try {
		return unseal(raw);
	} catch {
		return undefined;
	}
}

export function writeSession(cookies: Cookies, s: Session) {
	cookies.set(COOKIE, seal(s), {
		path: '/',
		expires: new Date(s.refreshExp)
	});
}

export function clearSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}
