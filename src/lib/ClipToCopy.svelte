<script lang="ts">
	import { fade } from 'svelte/transition';

	export let textToCopy = '';
	export let confirmMessage = '';
	let showToast = false;

	function copyToClipboard() {
		navigator.clipboard
			.writeText(textToCopy)
			.then(() => {
				showToast = true;
				setTimeout(() => {
					showToast = false;
				}, 2000); // Toast will disappear after 2 seconds
			})
			.catch((err) => {
				console.error('Failed to copy: ', err);
			});
	}
</script>

<div class="relative">
	<span class="text-neutral-700 dark:text-neutral-300">{textToCopy}</span>
	<button on:click={copyToClipboard} aria-label="Copy to clipboard" class="inline-block">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="-mb-[2px] ml-1 w-[18px] text-neutral-700 dark:text-neutral-300"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
		</svg>
	</button>
	{#if showToast}
		<div
			class="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform rounded bg-gray-800 px-2 py-1 text-sm font-semibold text-white transition-all duration-300 ease-in-out"
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
			class:opacity-0={!showToast}
			class:translate-y-2={!showToast}
		>
			{confirmMessage}
		</div>
	{/if}
</div>
