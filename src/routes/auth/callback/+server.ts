import { error, redirect } from '@sveltejs/kit';
import { sessionFromCode } from '$lib/server/bungie';
import { writeSession } from '$lib/server/session';

export async function GET({ url, cookies }) {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const expected = cookies.get('oauth_state');
	cookies.delete('oauth_state', { path: '/' });
	if (!code || !state || state !== expected) error(400, 'Invalid OAuth callback');

	writeSession(cookies, await sessionFromCode(code));
	redirect(302, '/');
}
