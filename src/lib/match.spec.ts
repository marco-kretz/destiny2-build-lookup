import { expect, test } from 'vitest';
import { availability, ownershipByName, worst } from './match';

const exotics = [
	{ hash: 1, name: 'Nighthawk', icon: '', isWeapon: false, collectibleHash: 10 },
	{ hash: 2, name: 'Nighthawk', icon: '', isWeapon: false, collectibleHash: 20 },
	{ hash: 3, name: 'Gjallarhorn', icon: '', isWeapon: true, collectibleHash: 30 },
	{ hash: 4, name: 'Whisper', icon: '', isWeapon: true, collectibleHash: 40 }
];

test('matches reissued exotics by name and falls back to collections', () => {
	const o = ownershipByName(exotics, new Set([2]), new Set([30]));
	expect(availability('Nighthawk', o)).toBe('owned');
	expect(availability('Gjallarhorn', o)).toBe('collection');
	expect(availability('Whisper', o)).toBe('missing');
});

test('build status is its worst item', () => {
	expect(worst([])).toBe('owned');
	expect(worst(['owned', 'collection'])).toBe('collection');
	expect(worst(['missing', 'collection', 'owned'])).toBe('missing');
});
