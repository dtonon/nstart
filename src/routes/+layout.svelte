<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { browser } from '$app/environment';
	import { onMount, onDestroy } from 'svelte';
	import { theme } from '$lib/store';
	import ThemeSwitcher from '$lib/ThemeSwitcher.svelte';

	let isModal = browser && window.self !== window.top;
	setContext('isModal', isModal);

	let mediaQuery: MediaQueryList | null = null;
	let systemTheme: string | null = null;

	function updateTheme(preferredTheme: string) {
		if (!browser) return;

		const themeToApply =
			preferredTheme === '' // Empty string means follow system theme
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

			if (configuredTheme === '') {
				$theme = systemTheme;
			} else {
				$theme = configuredTheme;
			}
		}
	}

	function handleSystemThemeChange(e: MediaQueryListEvent) {
		systemTheme = e.matches ? 'dark' : 'light';
		if ($theme === '') {
			// Only update if we're following system theme
			updateTheme('');
		}
	}

	onMount(() => {
		if (browser) {
			mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			systemTheme = mediaQuery.matches ? 'dark' : 'light';

			// Add listener for system theme changes
			mediaQuery.addEventListener('change', handleSystemThemeChange);

			// Initialize theme based on URL parameter or stored preference
			const params = new URLSearchParams(window.location.search);
			const forcedTheme = params.get('am');

			if (forcedTheme === 'light' || forcedTheme === 'dark') {
				$theme = forcedTheme;
			} else if ($theme === '') {
				// If no stored preference (empty string), follow system
				$theme = systemTheme;
			}
			// If there's a stored preference, it will be loaded automatically by the store

			// Listen for theme updates from parent window
			window.addEventListener('message', handleThemeUpdate);
		}
	});

	onDestroy(() => {
		if (browser) {
			mediaQuery?.removeEventListener('change', handleSystemThemeChange);
			window.removeEventListener('message', handleThemeUpdate);
		}
	});

	// Subscribe to theme changes
	$: updateTheme($theme);
</script>

{#if !isModal}
	<div class="fixed right-4 top-4 z-50">
		<ThemeSwitcher />
	</div>
{/if}

<slot />
