import type { Session } from '$lib/server/bungie';

declare global {
	namespace App {
		interface Locals {
			session?: Session;
		}
	}
}

export {};
