<script lang="ts">
	import { onMount } from 'svelte';
	import { shardGetBunker } from '@fiatjaf/promenade-trusted-dealer';
	import { pool } from '@nostr/gadgets/global';
	import { _ } from 'svelte-i18n';

	import { goto } from '$app/navigation';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import {
		accent,
		sk,
		name,
		pk,
		inboxes,
		bunkerURI,
		forceBunker,
		skipFollow,
		callingAppCode
	} from '$lib/store';
	import ClipToCopy from '$lib/ClipToCopy.svelte';
	import CheckboxWithLabel from '$lib/CheckboxWithLabel.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import { signers, minePow, selectReadRelays } from '$lib/nostr';
	import { isWasmSupported } from '$lib/wasm';
	import ContinueButton from '$lib/ContinueButton.svelte';
	import DoneIcon from '$lib/DoneIcon.svelte';

	let activateBunker = isWasmSupported();
	let bunkerActivating = false;
	let activationProgress = 0;

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($name.length === 0) {
			goto('/');
			return;
		}
	});

	async function activate(event: Event) {
		event.preventDefault();
		bunkerActivating = true;

		let intv = setInterval(() => {
			if (activationProgress < 98) activationProgress++;
		}, 3000);

		try {
			$bunkerURI = await shardGetBunker(
				pool,
				$sk,
				$pk,
				2,
				import.meta.env.DEV ? 2 : 3,
				signers,
				'wss://promenade.fiatjaf.com',
				20,
				$inboxes,
				$inboxes[$pk] || selectReadRelays(),
				minePow,
				(p: number) => {
					activationProgress = p;
				}
			);
			bunkerActivating = false;
		} catch (err) {
			console.error(err);
			bunkerActivating = false;
		}

		clearInterval(intv);
	}

	function downloadBunker() {
		const blob = new Blob(['Your bunker (Nostr connect) URL:\n\n' + $bunkerURI], {
			type: 'text/plain'
		});
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'nostr-bunker-url.txt';
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function navigateContinue() {
		if ($skipFollow) {
			if ($callingAppCode) {
				goto('/back');
			} else {
				goto('/finish');
			}
		} else {
			goto('/follow');
		}
	}
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]">{$_('bunker_page.title.part1')}</div>
					<div class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]" id="tw">
						{$_('bunker_page.title.part2')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">
					{@html $_('bunker_page.intro.split_nsec')}
					<a href="https://www.youtube.com/watch?v=ReN0kMzDFro" target="_blank">{$_('bunker_page.intro.frost_link')}</a>
					{@html $_('bunker_page.intro.frost_explanation')}
				</p>
				<p class="mt-6">
					{@html $_('bunker_page.intro.bunker_code')}
				</p>
				<p class="mt-6">
					{@html $_('bunker_page.intro.recovery')}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		{#if $bunkerURI === ''}
			<div class=" mt-6">
				{#if !$forceBunker}
					<div>
						<CheckboxWithLabel
							bind:checked={activateBunker}
							disabled={bunkerActivating || !isWasmSupported()}
						>
							{$_('bunker_page.interactive.checkbox')}
						</CheckboxWithLabel>
					</div>
				{/if}
			</div>
			{#if !isWasmSupported()}
				<div class="mt-6 bg-amber-100 dark:bg-amber-900 p-2">
					{$_('bunker_page.interactive.wasm_error')}
				</div>
			{/if}
			{#if activateBunker}
				<div class="mt-6 text-neutral-700 dark:text-neutral-300">
					{$_('bunker_page.interactive.processing')}<br />
				</div>
			{/if}
			{#if bunkerActivating || $bunkerURI !== ''}
				<div class="mt-6">
					<LoadingBar progress={activationProgress} />
				</div>
			{/if}
		{/if}

		{#if $bunkerURI !== ''}
			<div class="flex justify-center h-24 text-neutral-700 dark:text-neutral-300">
				<DoneIcon svgClass="w-24" />
			</div>
			<div class="mt-10 text-neutral-600 dark:text-neutral-300">
				{$_('bunker_page.interactive.success.title')}
			</div>
			<div class="mt-6 text-xl">
				<div class="break-words">
					<ClipToCopy textToCopy={$bunkerURI} confirmMessage={$_('bunker_page.interactive.success.copy_message')} />
				</div>
			</div>
			<button
				on:click={downloadBunker}
				class="mt-4 inline-flex w-full items-center justify-center rounded bg-accent px-8 py-3 text-[1.3rem] text-white"
			>
				{$_('bunker_page.interactive.success.download_button')} <img
					src="/icons/arrow-right.svg"
					alt="continue"
					class="ml-4 mr-2 h-5 w-5 rotate-90"
				/>
			</button>
		{/if}

		{#if activateBunker && $bunkerURI === ''}
			<div class="mt-16 flex justify-center sm:justify-end">
				<ContinueButton
					onClick={activate}
					disabled={bunkerActivating}
					text={bunkerActivating ? $_('bunker_page.buttons.activating') : $_('bunker_page.buttons.activate')}
				/>
			</div>
		{/if}

		{#if $bunkerURI !== '' || !activateBunker}
			<div class="mt-16 flex justify-center sm:justify-end">
				<ContinueButton
					onClick={navigateContinue}
					disabled={false}
					text={$bunkerURI !== '' ? $_('bunker_page.buttons.continue') : $_('bunker_page.buttons.skip')}
				/>
			</div>
		{/if}
	</div>
</TwoColumnLayout>
