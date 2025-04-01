<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/store';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';
	import LanguageSwitcher from '$lib/LanguageSwitcher.svelte';
	import { setupI18n } from '$lib/i18n';
	import { isI18nInitialized, initialBrowserLocale } from '$lib/i18n/store';
	import { _ } from 'svelte-i18n';

	let isModal = browser && window.self !== window.top;
	setContext('isModal', isModal);

	let mediaQuery: MediaQueryList | null = null;
	let systemTheme: string = 'light';

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

			// Initialize i18n
			console.log('Initializing i18n...');
			await setupI18n();
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

{#if browser && !$isI18nInitialized}
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-neutral-700 dark:text-neutral-300">Loading...</div>
	</div>
{:else}
	{#if browser && !isModal}
		<div class="fixed right-4 top-4 z-50 flex gap-2">
			{#if $initialBrowserLocale && $initialBrowserLocale !== 'en'}
				<LanguageSwitcher />
			{/if}
			<ThemeSwitcher />
		</div>
	{/if}

	<slot />
{/if}
