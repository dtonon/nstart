import { writable } from 'svelte/store';

export const isI18nInitialized = writable(false);
export const initialBrowserLocale = writable<string | null>(null); 