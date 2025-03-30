<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { bunkerURI, callingAppName, callingAppType, callingAppCode } from '$lib/store';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import { accent, name, npub } from '$lib/store';
	import QrCode from '$lib/QrCode.svelte';
	import { _ } from 'svelte-i18n';

	let actionURL: string;

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($name.length === 0) {
			goto('/');
		}

		// Set up the action URL based on the calling app type
		switch ($callingAppType) {
			case 'modal':
				if (browser && window.self !== window.top) {
					window.parent.postMessage(
						{
							type: 'WIZARD_COMPLETE',
							result: {
								nostrLogin: $bunkerURI
							}
						},
						'*'
					);
				}
				break;
			case 'web':
			case 'popup':
				actionURL = `${$callingAppCode}#nostr-login=${$bunkerURI}`;
				break;
			case 'android':
				actionURL = `intent:${$bunkerURI}#Intent;scheme=nostr-login;package=${$callingAppCode};end;`;
				break;
			case 'ios':
				actionURL = `${$callingAppCode}://${$bunkerURI}`;
				break;
		}
	});

	function redirectAndClose() {
		window.opener.location.href = actionURL;
		window.close();
	}

	function redirectBack() {
		window.location.href = actionURL;
		sessionStorage.clear();
	}
</script>

<BasicLayout>
	<div slot="content" class="animate-fade1">
		<!-- Welcome title -->
		<div class="relative mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
			<h1 class="font-bold">
				<div class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[6rem]">{$_('keys_page.title.part1')}</div>
				<div class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[7rem]" id="tw">
					{$_('keys_page.title.part2')}
				</div>
			</h1>
			{#if $bunkerURI}
				<div
					class="absolute right-0 top-8 hidden w-48 rotate-6 flex-col items-center text-center sm:flex"
				>
					<QrCode className="" data={$bunkerURI} />
					<span class="mt-4 text-sm text-accent">{$_('keys_page.qr_code.scan')}</span>
				</div>
			{/if}
		</div>

		<!-- Intro text -->
		<div class="text-neutral-700 dark:text-neutral-200 sm:w-[100%]">
			<p class="text-xl sm:w-[80%]">
				{@html $_('keys_page.intro.paragraph1', { values: { name: $name } })}
			</p>
			<div class="mt-8 grid grid-cols-2 gap-x-12 gap-y-6 sm:flex sm:flex-row sm:flex-wrap sm:gap-4">
				<a
					href="https://coracle.social"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/coracle.svg" alt="Coracle" class="h-24" />
					<div class="mt-2 text-center">{$_('keys_page.apps.coracle.name')}</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{$_('keys_page.apps.coracle.description')}</div>
					<div class="mt-2 text-center text-sm text-accent">{$_('keys_page.apps.coracle.type')}</div>
				</a>
				<a
					href="https://chachi.chat"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/chachi.svg" alt="Chachi" class="h-24" />
					<div class="mt-2 text-center">{$_('keys_page.apps.chachi.name')}</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{$_('keys_page.apps.chachi.description')}</div>
					<div class="mt-2 text-center text-sm text-accent">{$_('keys_page.apps.chachi.type')}</div>
				</a>
				<a
					href="https://olas.app"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/olas.svg" alt="Olas" class="h-24" />
					<div class="mt-2 text-center">{$_('keys_page.apps.olas.name')}</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{$_('keys_page.apps.olas.description')}</div>
					<div class="mt-2 text-center text-sm text-accent">{$_('keys_page.apps.olas.type')}</div>
				</a>
				<a
					href="https://nostur.com/"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/nostur.svg" alt="Wikistr" class="h-24" />
					<div class="mt-2 text-center">{$_('keys_page.apps.nostur.name')}</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{$_('keys_page.apps.nostur.description')}</div>
					<div class="mt-2 text-center text-sm text-accent">{$_('keys_page.apps.nostur.type')}</div>
				</a>
				<a
					href="https://jumble.social"
					target="_blank"
					class="flex w-[8.5rem] flex-col justify-self-center rounded-lg p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700"
				>
					<img src="/icons/jumble.svg" alt="Habla" class="h-24" />
					<div class="mt-2 text-center">{$_('keys_page.apps.jumble.name')}</div>
					<div class="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">{$_('keys_page.apps.jumble.description')}</div>
					<div class="mt-2 text-center text-sm text-accent">{$_('keys_page.apps.jumble.type')}</div>
				</a>
			</div>
			<p class="mt-8 text-neutral-500 dark:text-neutral-400 sm:w-[80%]">
				{$_('keys_page.intro.paragraph2')} <a href="https://nostrapps.com" target="_blank" class="underline"
					>{$_('keys_page.intro.paragraph3')}</a
				>!
			</p>
			<p class="mt-6 sm:w-[80%]">
				{$_('keys_page.intro.paragraph4')}<br />
				<a href="https://njump.me/{$npub}" target="_blank" class="break-all underline"
					>njump.me/{$npub}</a
				>
			</p>
		</div>
	</div>
</BasicLayout>
