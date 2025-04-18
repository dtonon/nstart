<script lang="ts">
	import { onMount } from 'svelte';
	import WizardAnalyticsClient from '$lib/wizard-analytics-client';
	import { t, currentLanguage } from '$lib/i18n';
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

	let backupInitialized = false;
	let backupDone = false;
	let backupPrivKey = '';
	let encrypt = false;

	const analytics = new WizardAnalyticsClient();

	onMount(async () => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($name.length === 0) {
			goto('/');
		}

		if ($password) {
			encrypt = true;
		}

		await analytics.startStep('download');
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

	async function navigateContinue() {
		$backupDownloaded = true;

		await analytics.completeStep({
			type: $ncryptsec ? 'ncryptsec' : 'nsec'
		});

		goto(`/${$currentLanguage}/email`);
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
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div
						class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]"
					>
						{t('download.title1')}
					</div>
					<div
						class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]"
						id="tw"
					>
						{t('download.title2')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">
					{@html t('download.side1', $name)}
				</p>
				<p class="mt-6">
					{@html t('download.side2', 'class="italic"')}
				</p>
				<p class="mt-6">
					{@html t('download.side3', 'class="italic"')}
				</p>
				<p class="mt-6">
					{@html t('download.side4', 'class="italic"')}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		{#if !backupInitialized}
			<div class="text-xl">
				<div class="text-neutral-400 dark:text-neutral-400">{t('download.label_yournpub')}</div>
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
						{t('download.button_save1')}
						<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-5 w-5 rotate-90" />
					</button>

					<button
						on:click={() => {
							encrypt = true;
						}}
						class="mt-2 text-center text-sm text-neutral-400 hover:underline dark:text-neutral-400"
						>{t('download.label_switch1')}</button
					>
				{/if}

				{#if encrypt}
					<!-- svelte-ignore a11y-autofocus -->
					<input
						type="text"
						bind:value={$password}
						placeholder={t('download.label_password')}
						required
						autofocus={!$isMobile}
						autocapitalize="off"
						class="input-hover-enabled w-full rounded border-2 border-neutral-300 bg-white px-4 py-2 text-xl text-black focus:border-neutral-700 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
					/>
					<button
						class="mt-6 inline-flex w-full items-center justify-center rounded bg-accent px-8 py-3 text-[1.3rem] text-white"
						disabled={$ncryptsec === ''}
						on:click={downloadBackup}
					>
						{t('download.button_save2')}
						<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-5 w-5 rotate-90" />
					</button>

					<button
						on:click={() => {
							encrypt = false;
							$password = '';
						}}
						class="mt-2 text-center text-sm text-neutral-400 hover:underline dark:text-neutral-500"
						>{t('download.label_switch2')}</button
					>
				{/if}
				<div class="mt-8 text-neutral-600 dark:text-neutral-300">
					{t('download.text1')}
				</div>
			{:else}
				<div class="flex h-24 justify-center text-neutral-700 dark:text-neutral-300">
					<DoneIcon />
				</div>
				<div class="mt-10 text-neutral-600 dark:text-neutral-300">
					{t('download.text2')}
					<div
						class="my-4 rounded bg-yellow-100 px-6 py-4 dark:bg-yellow-500 dark:text-neutral-950"
					>
						{previewDownloadKey(backupPrivKey)}
					</div>
					{#if encrypt}
						{@html t('download.text3', $password)}
					{:else}
						{t('download.text4')}
					{/if}
				</div>
				<div class="mt-8">
					<CheckboxWithLabel bind:checked={backupDone}>
						{#if encrypt}
							{t('download.text5')}
						{:else}
							{t('download.text6')}
						{/if}
					</CheckboxWithLabel>
				</div>
				<button
					on:click={() => {
						backupInitialized = false;
						backupDone = false;
					}}
					class="mt-6 text-left text-sm text-neutral-400 hover:underline dark:text-neutral-400"
					>{t('download.text7')}</button
				>
			{/if}
		</div>

		<div class="mt-16 flex justify-center sm:justify-end">
			<ContinueButton
				onClick={navigateContinue}
				disabled={!backupDone && !$backupDownloaded}
				text={t('shared.button_continue')}
			/>
		</div>
	</div>
</TwoColumnLayout>
