export const availableLanguages = [
	{ code: 'en', name: 'English', default: true },
	{ code: 'es', name: 'Español' },
	{ code: 'it', name: 'Italiano' },
	{ code: 'ja', name: '日本語' }
];

export const defaultLanguage =
	availableLanguages.find((lang) => lang.default) || availableLanguages[0];
