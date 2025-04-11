export const availableLanguages = [
	{ code: 'en', name: 'English', default: true },
	{ code: 'es', name: 'Español' },
	{ code: 'it', name: 'Italiano' }
];

export const defaultLanguage =
	availableLanguages.find((lang) => lang.default) || availableLanguages[0];
