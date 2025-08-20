<script lang="ts">
	import { theme } from '$lib/store';
	import { browser } from '$app/environment';

	let systemTheme = 'light';
	let mediaQuery: MediaQueryList;

	if (browser) {
		mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		systemTheme = mediaQuery.matches ? 'dark' : 'light';

		// Initialize theme to system preference if not set
		if (!$theme) {
			$theme = systemTheme;
		}

		// Listen for system theme changes
		mediaQuery.addEventListener('change', (e) => {
			systemTheme = e.matches ? 'dark' : 'light';
			// If theme is synced with system, update it
			if ($theme === (systemTheme === 'dark' ? 'light' : 'dark')) {
				$theme = systemTheme;
			}
		});
	}

	function toggleTheme() {
		if ($theme === systemTheme) {
			// If synced with system, switch to opposite
			$theme = systemTheme === 'dark' ? 'light' : 'dark';
		} else {
			// If not synced, go back to system theme
			$theme = systemTheme;
		}
	}
</script>

<button
	on:click={toggleTheme}
	class="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
>
	{#if $theme === 'dark'}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
		</svg>
	{:else}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<circle cx="12" cy="12" r="5" />
			<line x1="12" y1="1" x2="12" y2="3" />
			<line x1="12" y1="21" x2="12" y2="23" />
			<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
			<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
			<line x1="1" y1="12" x2="3" y2="12" />
			<line x1="21" y1="12" x2="23" y2="12" />
			<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
			<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
		</svg>
	{/if}
</button>
