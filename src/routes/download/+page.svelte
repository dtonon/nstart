<script lang="ts">
	import { onMount } from 'svelte';
	import * as nip19 from '@nostr/tools/nip19';
	import * as nip49 from '@nostr/tools/nip49';

	import { goto } from '$app/navigation';
	import { accent, sk, npub, ncryptsec, backupDownloaded, name, password } from '$lib/store';
	import { isMobile } from '$lib/mobile';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import ClipToCopy from '$lib/ClipToCopy.svelte';
	import CheckboxWithLabel from '$lib/CheckboxWithLabel.svelte';
	import ContinueButton from '$lib/ContinueButton.svelte';
	import DoneIcon from '$lib/DoneIcon.svelte';
	import { browser } from '$app/environment';
	import { bunkerURI, callingAppName, callingAppType, callingAppCode } from '$lib/store';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import QrCode from '$lib/QrCode.svelte';
	import { _ } from 'svelte-i18n';

	let backupInitialized = false;
	let backupDone = false;
	let backupPrivKey = '';
	let encrypt = false;
	let actionURL: string;

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($name.length === 0) {
			goto('/');
		}

		if ($password) {
			encrypt = true;
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

	function downloadBackup() {
		backupPrivKey = $ncryptsec || nip19.nsecEncode($sk);
		const blob = new Blob([$npub + '\n\n' + backupPrivKey], {
			type: 'text/plain'
		});
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'nostr-private-key.txt';
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		backupInitialized = true;
	}

	function navigateContinue() {
		$backupDownloaded = true;
		goto('/email');
	}

	function previewDownloadKey(str: string): string {
		let startCount = 10;
		if (str.startsWith('ncryptsec1')) {
			startCount = 15;
		}
		const firstPart = str.slice(0, startCount);
		const lastPart = str.slice(-8);
		return `${firstPart} ... ${lastPart}`;
	}

	function redirectAndClose() {
		window.opener.location.href = actionURL;
		window.close();
	}

	function redirectBack() {
		window.location.href = actionURL;
		sessionStorage.clear();
	}
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]">{$_('download_page.title.part1')}</div>
					<div class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]" id="tw">
						{$_('download_page.title.part2')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">
					{@html $_('keys_page.intro.paragraph1', { values: { name: $name } })}
				</p>
				<p class="mt-6">
					{$_('keys_page.intro.paragraph2')} <a href="https://nostrapps.com" target="_blank" class="underline"
						>{$_('keys_page.intro.paragraph3')}</a
					>!
				</p>
				<p class="mt-6">
					{$_('keys_page.intro.paragraph4')}
					<br />
					<a href="https://njump.me/{$npub}" target="_blank" class="break-all underline"
						>njump.me/{$npub}</a
					>
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		{#if !backupInitialized}
			<div class="text-xl">
				<div class="text-neutral-400 dark:text-neutral-400">{$_('download_page.interactive.npub_label')}</div>
				<div class="break-words">
					<ClipToCopy textToCopy={$npub} confirmMessage="Copied!" />
				</div>
			</div>
		{/if}

		<div class="mt-10 flex flex-col justify-end">
			{#if !backupInitialized}
				{#if !encrypt}
					<button
						on:click={downloadBackup}
						class="inline-flex w-full items-center justify-center rounded bg-accent px-8 py-3 text-[1.3rem] text-white"
					>
						{$_('download_page.interactive.save_nsec')} <img
							src="/icons/arrow-right.svg"
							alt="continue"
							class="ml-4 mr-2 h-5 w-5 rotate-90"
						/>
					</button>

					<button
						on:click={() => {
							encrypt = true;
						}}
						class="mt-2 text-center text-sm text-neutral-400 dark:text-neutral-400 hover:underline"
						>{$_('download_page.interactive.encrypt_version')}</button
					>
				{/if}

				{#if encrypt}
					<!-- svelte-ignore a11y-autofocus -->
					<input
						type="text"
						bind:value={$password}
						placeholder={$_('download_page.interactive.password_placeholder')}
						required
						autofocus={!$isMobile}
						autocapitalize="off"
						class="input-hover-enabled w-full rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-xl text-black dark:text-white focus:border-neutral-700 dark:focus:border-neutral-400 focus:outline-none"
					/>
					<button
						class="mt-6 inline-flex w-full items-center justify-center rounded bg-accent px-8 py-3 text-[1.3rem] text-white"
						disabled={$ncryptsec === ''}
						on:click={downloadBackup}
					>
						{$_('download_page.interactive.save_ncryptsec')} <img
							src="/icons/arrow-right.svg"
							alt="continue"
							class="ml-4 mr-2 h-5 w-5 rotate-90"
						/>
					</button>

					<button
						on:click={() => {
							encrypt = false;
							$password = '';
						}}
						class="mt-2 text-center text-sm text-neutral-400 dark:text-neutral-500 hover:underline"
						>{$_('download_page.interactive.plain_nsec')}</button
					>
				{/if}
				<div class="mt-8 text-neutral-600 dark:text-neutral-300">
					{$_('download_page.interactive.nsec_explanation')}
				</div>
			{:else}
				<div class="flex justify-center h-24 text-neutral-700 dark:text-neutral-300">
						<DoneIcon />
				</div>
				<div class="mt-10 text-neutral-600 dark:text-neutral-300">
					{$_('download_page.interactive.verify_backup.title')}
					<div class="my-4 rounded bg-yellow-100 dark:bg-yellow-500 px-6 py-4 dark:text-neutral-950">
						{previewDownloadKey(backupPrivKey)}
					</div>
					{#if encrypt}
						{@html $_('download_page.interactive.verify_backup.save_password', { values: { password: $password } })}
					{:else}
						{$_('download_page.interactive.verify_backup.save_file')}
					{/if}
				</div>
				<div class="mt-8">
					<CheckboxWithLabel bind:checked={backupDone}>
						{#if encrypt}
							{$_('download_page.interactive.verify_backup.checkbox_encrypted')}
						{:else}
							{$_('download_page.interactive.verify_backup.checkbox_plain')}
						{/if}
					</CheckboxWithLabel>
				</div>
				<button
					on:click={() => {
						backupInitialized = false;
						backupDone = false;
					}}
					class="mt-6 text-left text-sm text-neutral-400 dark:text-neutral-400 hover:underline"
					>{$_('download_page.interactive.verify_backup.download_again')}</button
				>
			{/if}
		</div>

		<div class="mt-16 flex justify-center sm:justify-end">
			<ContinueButton
				onClick={navigateContinue}
				disabled={!backupDone && !$backupDownloaded}
				text={$_('download_page.buttons.continue')}
			/>
		</div>
	</div>
</TwoColumnLayout>

<BasicLayout>
	<div slot="content" class="animate-fade1">
		<!-- Welcome title -->
		<div class="relative mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
			<h1 class="font-bold">
				<div class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]">{$_('download_page.title.part1')}</div>
				<div class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]" id="tw">
					{$_('download_page.title.part2')}
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
				{@html $_('download_page.intro.well_done', { values: { name: $name } })}
			</p>
			<p class="mt-6">
				{@html $_('download_page.intro.public_key')}
			</p>
			<p class="mt-6">
				{@html $_('download_page.intro.private_key')}
			</p>
			<p class="mt-6">
				{@html $_('download_page.intro.download')}
			</p>
			<div class="mt-8">
				<button
					on:click={$callingAppType === 'popup' ? redirectAndClose : redirectBack}
					type="submit"
					class="inline-flex items-center rounded bg-accent px-6 py-4 text-[1.8rem] text-white sm:px-10"
				>
					{$_('download_page.buttons.download')}
					<img src="/icons/arrow-right.svg" alt="Icon" class="ml-4 mr-2 h-7 w-7" />
				</button>
			</div>
			<p class="mt-6 sm:w-[80%]">
				{$_('keys_page.intro.paragraph4')}<br />
				<a href="https://njump.me/{$npub}" target="_blank" class="break-all underline"
					>njump.me/{$npub}</a
				>
			</p>
		</div>
	</div>
</BasicLayout>
