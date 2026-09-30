export const LANGS = ['de', 'en', 'fr'] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (value: string | undefined): value is Lang => LANGS.includes(value as Lang);

/**
 * An explicit choice wins, otherwise the first supported Accept-Language entry.
 * ponytail: assumes the header is ordered by preference (browsers send it that way), q-values are ignored.
 */
export function resolveLang(choice: string | undefined, acceptLanguage: string | null): Lang {
	if (isLang(choice)) return choice;
	for (const part of (acceptLanguage ?? '').split(',')) {
		const lang = part.split(';')[0].split('-')[0].trim().toLowerCase();
		if (isLang(lang)) return lang;
	}
	return 'en';
}
