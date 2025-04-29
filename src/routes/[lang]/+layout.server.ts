import { availableLanguages, defaultLanguage } from '$lib/i18n/config';

export function load({ params }: { params: { lang: string } }) {
	const { lang } = params;

	// Validate the language
	const validLang = availableLanguages.find((l) => l.code === lang) ? lang : defaultLanguage.code;

	return {
		lang: validLang
	};
}
