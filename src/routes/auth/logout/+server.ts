import { redirect } from '@sveltejs/kit';
import { clearSession } from '$lib/server/session';

export function POST({ cookies }) {
	clearSession(cookies);
	redirect(303, '/');
}
