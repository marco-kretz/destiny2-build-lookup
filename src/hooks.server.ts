import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { refreshSession } from '$lib/server/bungie';
import { clearSession, readSession, writeSession } from '$lib/server/session';

const REFRESH_MARGIN = 60 * 1000;

export const handle: Handle = async ({ event, resolve }) => {
	let session = readSession(event.cookies);
	if (session && session.accessExp - REFRESH_MARGIN < Date.now()) {
		try {
			session = await refreshSession(session);
			writeSession(event.cookies, session);
		} catch {
			session = undefined;
			clearSession(event.cookies);
		}
	}
	event.locals.session = session;
	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	// HSTS on localhost would stick to every other local dev server
	if (!dev) response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	return response;
};
