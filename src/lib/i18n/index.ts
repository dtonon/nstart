import { writable, derived, get } from 'svelte/store';
import { availableLanguages, defaultLanguage } from './config';
import { browser } from '$app/environment';

// Create stores
export const currentLanguage = writable(defaultLanguage.code);
export const translations = writable({});
export const translationsLoaded = writable(false);

// Cache for loaded translations
const translationCache = {};

export async function loadTranslations(lang: string) {
	const translationCache: Record<string, Record<string, any>> = {};

	// Return from cache if available
	if (translationCache[lang]) {
		translations.set(translationCache[lang]);
		translationsLoaded.set(true);
		return translationCache[lang];
	}

	try {
		const module = await import(`../../../src/lib/i18n/translations/${lang}.json`);
		const loadedTranslations = module.default || {};
		translationCache[lang] = loadedTranslations;

		// Update the store
		translations.set(loadedTranslations);
		translationsLoaded.set(true);
		return loadedTranslations;
	} catch (e) {
		console.error(`Could not load translations for ${lang}:`, e);

		// Fallback to default language if it's not the one that failed
		if (lang !== defaultLanguage.code) {
			console.log(`Falling back to ${defaultLanguage.code}`);
			return loadTranslations(defaultLanguage.code);
		}

		// Set empty translations as fallback
		translations.set({});
		translationsLoaded.set(true);
		return {};
	}
}

export async function setLanguage(lang: string) {
	// Validate the language
	const validLang = availableLanguages.find((l) => l.code === lang) ? lang : defaultLanguage.code;

	console.log(`Setting language to ${validLang}`);
	currentLanguage.set(validLang);
	await loadTranslations(validLang);

	// Set lang attribute on HTML element
	if (browser) {
		document.documentElement.setAttribute('lang', validLang);
	}

	return validLang;
}

// Translation function
export function t(key: string, ...params: string[]): string {
	const $translations = get(translations);

	if (!$translations) {
		console.warn(`Translation store is empty when trying to translate: ${key}`);
		return key;
	}

	const keys = key.split('.');
	let value: any = $translations;

	for (const k of keys) {
		if (value && typeof value === 'object' && k in value) {
			value = value[k as keyof typeof value];
		} else {
			console.warn(`Translation key not found: ${key}`);
			return key;
		}
	}

	if (typeof value !== 'string') {
		console.warn(`Translation value is not a string for key: ${key}`);
		return key; // Return the key if value is not a string
	}

	// Replace placeholders with corresponding params
	let result = value;
	params.forEach((param, index) => {
		// Look for placeholders in format {$1}, {$2}, etc.
		result = result.replace(new RegExp(`\\{\\$${index + 1}\\}`, 'g'), param);
	});

	return result;
}
