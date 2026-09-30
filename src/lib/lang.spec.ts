import { expect, test } from 'vitest';
import { resolveLang } from './lang';

test('explicit choice wins over the browser', () => {
	expect(resolveLang('fr', 'de-DE,de;q=0.9')).toBe('fr');
});

test('first supported Accept-Language entry, region stripped', () => {
	expect(resolveLang(undefined, 'nl-NL, fr-CH;q=0.9, de;q=0.8')).toBe('fr');
	expect(resolveLang('auto', 'DE-at')).toBe('de');
});

test('falls back to English', () => {
	expect(resolveLang(undefined, 'ja,nl')).toBe('en');
	expect(resolveLang(undefined, null)).toBe('en');
});
