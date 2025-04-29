<script lang="ts">
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/store';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import LanguageSelector from '$lib/LanguageSelector.svelte';
	import { availableLanguages, defaultLanguage } from '$lib/i18n/config';
	import { setLanguage, currentLanguage, translationsLoaded } from '$lib/i18n';

	let isModal = browser && window.self !== window.top;
	setContext('isModal', isModal);

	let mediaQuery: MediaQueryList | null = null;
	let systemTheme: string | null = null;

	function updateTheme(preferredTheme: string) {
		if (!browser) return;

		const themeToApply =
			preferredTheme === 'system'
				? systemTheme || (mediaQuery?.matches ? 'dark' : 'light')
				: preferredTheme;

		if (themeToApply === 'dark') {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	function handleThemeUpdate(event: MessageEvent) {
		if (event.data.type === 'THEME_UPDATE') {
			systemTheme = event.data.systemTheme;
			const configuredTheme = event.data.configuredTheme;

			if (configuredTheme === 'system') {
				$theme = systemTheme;
			} else {
				$theme = configuredTheme;
			}
		}
	}

	async function changeLanguage(newLang: string) {
		const currentPath = $page.url.pathname;

		// First set the language and load translations
		await setLanguage(newLang);

		// Then navigate to new URL
		if (currentPath.match(/^\/[a-z]{2}(\/.+)?$/)) {
			// If already on a language path, replace the language segment
			const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLang}`);

			// Use replaceState to change URL without triggering navigation
			if (browser) {
				history.replaceState(null, '', newPath);
				window.location.reload();
			}
		} else {
			// If on the root or a non-language path, do full navigation
			goto(`/${newLang}/`);
		}
	}

	onMount(async () => {
		if (browser) {
			mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			systemTheme = mediaQuery.matches ? 'dark' : 'light';

			// Initialize theme based on URL parameter or system preference
			const params = new URLSearchParams(window.location.search);

			const forcedTheme = params.get('am');
			if (forcedTheme === 'light' || forcedTheme === 'dark') {
				$theme = forcedTheme;
			} else {
				$theme = systemTheme;
			}

			// Listen for theme updates from parent window
			window.addEventListener('message', handleThemeUpdate);
		}
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('message', handleThemeUpdate);
		}
	});

	// Subscribe to theme changes
	$: updateTheme($theme);
</script>

{#if !isModal}
	<div class="absolute right-4 top-4 z-50 flex items-center gap-3">
		{#if $page.route.id === '/[lang]'}
			<LanguageSelector
				{availableLanguages}
				currentLanguage={$currentLanguage}
				translationsLoaded={$translationsLoaded}
				onChange={changeLanguage}
			/>
		{/if}
		<!-- Theme Switcher -->
		<ThemeSwitcher />
	</div>
{/if}

{#if $translationsLoaded}
	<slot />
{/if}
