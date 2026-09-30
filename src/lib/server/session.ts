import type { Cookies } from '@sveltejs/kit';
import type { Session } from './bungie';

const COOKIE = 'session';

export function readSession(cookies: Cookies): Session | undefined {
	const raw = cookies.get(COOKIE);
	if (!raw) return undefined;
	try {
		return JSON.parse(raw) as Session;
	} catch {
		return undefined;
	}
}

export function writeSession(cookies: Cookies, s: Session) {
	cookies.set(COOKIE, JSON.stringify(s), {
		path: '/',
		expires: new Date(s.refreshExp)
	});
}

export function clearSession(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/' });
}
