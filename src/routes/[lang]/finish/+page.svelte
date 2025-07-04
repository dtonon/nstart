<script lang="ts">
	import { onMount } from 'svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import { sessionId, accent, name, npub, bunkerURI } from '$lib/store';
	import QrCode from '$lib/QrCode.svelte';

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($sessionId.length === 0) {
			goto(`/${$currentLanguage}/`);
			return;
		}
	});
</script>

<BasicLayout>
	<div slot="content" class="animate-fade1">
		<!-- Welcome title -->
		<div class="relative mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
			<h1 class="font-bold">
				{#if $currentLanguage === 'tr'}
					<div
						class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[7rem]"
						id="tw"
					>
						{t('finish.title2')}
					</div>
					<div
						class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[6rem]"
					>
						{t('finish.title1')}
					</div>
				{:else}
					<div
						class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[6rem]"
					>
						{t('finish.title1')}
					</div>
					<div
						class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[7rem]"
						id="tw"
					>
						{t('finish.title2')}
					</div>
				{/if}
			</h1>
			{#if $bunkerURI}
				<div
					class="absolute right-0 top-8 hidden w-48 rotate-6 flex-col items-center text-center sm:flex"
				>
					<QrCode className="" data={$bunkerURI} />
					<span class="mt-4 text-sm text-accent">{t('finish.text1')}</span>
				</div>
			{/if}
		</div>

		<!-- Intro text -->
		<div class="text-neutral-700 dark:text-neutral-200 sm:w-[100%]">
			<p class="text-xl sm:w-[80%]">
				{@html t('finish.text2', $name)}
			</p>
			<div class="mt-8 grid grid-cols-2 gap-x-12 gap-y-6 sm:flex sm:flex-row sm:flex-wrap sm:gap-4">
				<a
					href="https://coracle.social"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/coracle.svg" alt="Coracle" class="h-24" />
					<div class="mt-2 text-center">Coracle</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						{t('finish.label1')}
					</div>
					<div class="mt-2 text-center text-sm text-accent">Web app</div>
				</a>
				<a
					href="https://chachi.chat"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/chachi.svg" alt="Chachi" class="h-24" />
					<div class="mt-2 text-center">Chachi</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						{t('finish.label2')}
					</div>
					<div class="mt-2 text-center text-sm text-accent">Web app</div>
				</a>
				<a
					href="https://olas.app"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/olas.svg" alt="Olas" class="h-24" />
					<div class="mt-2 text-center">Olas</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						{t('finish.label3')}
					</div>
					<div class="mt-2 text-center text-sm text-accent">Android / IOS</div>
				</a>
				<a
					href="https://nostur.com/"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/nostur.svg" alt="Wikistr" class="h-24" />
					<div class="mt-2 text-center">Nostur</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						{t('finish.label1')}
					</div>
					<div class="mt-2 text-center text-sm text-accent">IOS / macOS</div>
				</a>
				<a
					href="https://jumble.social"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/jumble.svg" alt="Habla" class="h-24" />
					<div class="mt-2 text-center">Jumble.social</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
						{t('finish.label1')}
					</div>
					<div class="mt-2 text-center text-sm text-accent">Web app</div>
				</a>
			</div>
			<p class="mt-8 text-neutral-500 dark:text-neutral-400 sm:w-[80%]">
				{@html t('finish.text3', 'href="https://nostrapps.com" target="_blank" class="underline"')}
			</p>
			<p class="mt-6 sm:w-[80%]">
				{@html t(
					'finish.text4',
					`href="https://njump.me/${$npub}" target="_blank" class="break-all underline"`,
					$npub
				)}
			</p>
		</div>
	</div>
</BasicLayout>
