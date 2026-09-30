import type { Handle } from '@sveltejs/kit';
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
	return resolve(event);
};
