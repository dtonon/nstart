import { browser } from '$app/environment';
import { init, register, locale, waitLocale } from 'svelte-i18n';
import { isI18nInitialized, initialBrowserLocale } from './store';

const defaultLocale = 'en';
const supportedLocales = ['en', 'de', 'it', 'fr', 'es'];

// Register all locales
register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));
register('it', () => import('./locales/it.json'));
register('fr', () => import('./locales/fr.json'));
register('es', () => import('./locales/es.json'));

function getInitialLocale(): string {
  if (!browser) return defaultLocale;
  
  // Get browser language
  const browserLang = window.navigator.language.split('-')[0];
  console.log('Browser language:', browserLang);
  
  // Store the initial browser locale
  initialBrowserLocale.set(browserLang);
  
  // Check if browser language is supported
  if (supportedLocales.includes(browserLang)) {
    console.log('Using browser language:', browserLang);
    return browserLang;
  }
  
  console.log('Using default language:', defaultLocale);
  return defaultLocale;
}

export async function setupI18n() {
  const initialLocale = getInitialLocale();
  console.log('Setting up i18n with locale:', initialLocale);
  
  init({
    fallbackLocale: defaultLocale,
    initialLocale: initialLocale,
    loadingDelay: 200
  });

  // Wait for the locale to be loaded
  await waitLocale();
  isI18nInitialized.set(true);
}

// Initialize i18n immediately for SSR
if (!browser) {
  init({
    fallbackLocale: defaultLocale,
    initialLocale: defaultLocale,
    loadingDelay: 200
  });
  // Set the locale immediately for SSR
  locale.set(defaultLocale);
}

export { locale, waitLocale }; 