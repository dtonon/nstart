<script>
	import { onMount } from 'svelte';

	export let availableLanguages;
	export let currentLanguage;
	export let translationsLoaded = true;
	export let onChange;

	let dropdownOpen = false;
	let selectedLanguage;

	$: {
		selectedLanguage =
			availableLanguages.find((lang) => lang.code === currentLanguage) || availableLanguages[0];
	}

	function toggleDropdown() {
		if (translationsLoaded) {
			dropdownOpen = !dropdownOpen;
		}
	}

	function selectLanguage(language) {
		if (onChange) {
			onChange(language.code);
		}
		dropdownOpen = false;
	}

	// Click outside handler
	function handleClickOutside(node) {
		const handleClick = (event) => {
			if (node && !node.contains(event.target) && !event.defaultPrevented) {
				dropdownOpen = false;
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}
</script>

<div class="relative" use:handleClickOutside>
	<button
		class="flex items-center rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
		on:click={toggleDropdown}
		disabled={!translationsLoaded}
		aria-haspopup="listbox"
		aria-expanded={dropdownOpen}
		type="button"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
			/>
		</svg>

		<span class="ml-2">{selectedLanguage?.code.toUpperCase()}</span>

		<svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d={dropdownOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
			/>
		</svg>
	</button>

	{#if dropdownOpen}
		<div
			class="absolute right-0 z-10 mt-1 w-48 overflow-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
			role="listbox"
		>
			{#each availableLanguages as language}
				<button
					class="flex w-full items-center px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 {currentLanguage ===
					language.code
						? 'bg-neutral-50 font-medium dark:bg-neutral-700/50'
						: ''}"
					role="option"
					aria-selected={currentLanguage === language.code}
					on:click={() => selectLanguage(language)}
					type="button"
				>
					<span>{language.name}</span>
					{#if currentLanguage === language.code}
						<svg class="ml-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
