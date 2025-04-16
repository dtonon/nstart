export const availableLanguages = [
	{ code: 'en', name: 'English', default: true },
	{ code: 'es', name: 'Español' },
	{ code: 'it', name: 'Italiano' },
	{ code: 'fr', name: 'Français' },
	{ code: 'de', name: 'Deutsch' },
	{ code: 'ja', name: '日本語' },
	{ code: 'zh', name: '简体中文' }
];

export const defaultLanguage =
	availableLanguages.find((lang) => lang.default) || availableLanguages[0];
