<script lang="ts">
	import '../app.css';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { availableLanguages, defaultLanguage } from '$lib/i18n/config';
	import { setLanguage } from '$lib/i18n';

	onMount(() => {
		// Skip language check for the /analytics page
		if (window.location.pathname === '/analytics') {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		// Initialize language based on URL structure, passed param, browser lang
		// Or fallback to the default (en)

		const queryString = window.location.search;
		const paramLang = params.get('al');
		const urlLang = $page.params.lang;
		const browserLang = navigator.language.split('-')[0];
		console.log('availableLanguages', availableLanguages);

		if (urlLang && availableLanguages.find((l) => l.code === urlLang)) {
			console.log('Set lang via URL structure', urlLang);
			setLanguage(urlLang);
		} else if (paramLang != null && availableLanguages.find((l) => l.code === paramLang)) {
			console.log('Set lang with al param', paramLang);
			setLanguage(paramLang);
			goto(`/${paramLang}/${queryString}`);
		} else if (browserLang && availableLanguages.find((l) => l.code === browserLang)) {
			console.log('Using browser language match:', browserLang);
			setLanguage(browserLang);
			goto(`/${browserLang}/${queryString}`);
		} else {
			// Fall back to default language if no match
			console.log('Falling back to default language:', defaultLanguage.code);
			setLanguage(defaultLanguage.code);
			goto(`/${defaultLanguage.code}/${queryString}`);
		}
	});
</script>

<slot />
