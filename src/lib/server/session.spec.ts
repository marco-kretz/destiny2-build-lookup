import { describe, expect, it, vi } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { readSession, writeSession } from './session';

vi.mock('$env/dynamic/private', () => ({ env: { SESSION_SECRET: 'test-secret' } }));

const session = { access: 'a', accessExp: 1, refresh: 'r', refreshExp: Date.now() + 1000, mType: 3, mId: '42', name: 'Guardian#1' };

function jar() {
	const values = new Map<string, string>();
	return {
		get: (name: string) => values.get(name),
		set: (name: string, value: string) => void values.set(name, value)
	} as unknown as Cookies;
}

describe('session cookie', () => {
	it('round-trips without exposing the tokens', () => {
		const cookies = jar();
		writeSession(cookies, session);
		expect(cookies.get('session')).not.toContain('refresh');
		expect(readSession(cookies)).toEqual(session);
	});

	it('rejects tampered and legacy plain-JSON cookies', () => {
		const cookies = jar();
		writeSession(cookies, session);
		const sealed = cookies.get('session')!;
		cookies.set('session', sealed.slice(0, -2) + (sealed.endsWith('AA') ? 'BB' : 'AA'), { path: '/' });
		expect(readSession(cookies)).toBeUndefined();
		cookies.set('session', JSON.stringify(session), { path: '/' });
		expect(readSession(cookies)).toBeUndefined();
	});
});
