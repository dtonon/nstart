<script lang="ts">
	export let onClick: (event: Event) => Promise<void> | void;
	export let disabled = false;
	export let text: string;
</script>

<button
	on:click={onClick}
	{disabled}
	class={`inline-flex items-center rounded px-8 py-3 text-[1.6rem] sm:text-[1.3rem] ${
		disabled
			? 'cursor-not-allowed bg-neutral-400 text-neutral-300 dark:bg-neutral-600 dark:text-neutral-500'
			: 'bg-accent text-white'
	}`}
>
	{text}
	<div class="ml-4 mr-2">
		<svg class="h-6 w-6" viewBox="0 0 32 29" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				fill="currentColor"
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M16.0695 1.17273C16.7448 0.497436 17.8397 0.497436 18.515 1.17273L30.6195 13.2773C31.2948 13.9526 31.2948 15.0475 30.6195 15.7228L18.515 27.8274C17.8397 28.5026 16.7448 28.5026 16.0695 27.8274C15.3942 27.1521 15.3942 26.0571 16.0695 25.3819L25.2221 16.2293H1.72922C0.774208 16.2293 0 15.4551 0 14.5001C0 13.545 0.774208 12.7708 1.72922 12.7708H25.2221L16.0695 3.61823C15.3942 2.94292 15.3942 1.84805 16.0695 1.17273Z"
			/>
		</svg>
	</div>
</button>
