import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { AUTHORIZE_URL } from '$lib/server/bungie';

export function GET({ cookies }) {
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 600 });
	const params = new URLSearchParams({ client_id: env.BUNGIE_CLIENT_ID ?? '', response_type: 'code', state });
	redirect(302, `${AUTHORIZE_URL}?${params}`);
}
