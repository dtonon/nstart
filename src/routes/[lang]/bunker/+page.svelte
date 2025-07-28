<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import { base32 } from '@scure/base';
	import WizardAnalyticsClient from '$lib/wizard-analytics-client';
	import { t, currentLanguage } from '$lib/i18n';
	import { shardGetBunker } from '@fiatjaf/promenade-trusted-dealer';
	import { finalizeEvent } from '@nostr/tools/pure';
	import { pool } from '@nostr/gadgets/global';

	import { goto } from '$app/navigation';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import {
		coordinator,
		sessionId,
		accent,
		sk,
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
	let advanceSignersSelection = false;
	let selectedSigners = new Set(signers.map((s) => s.pubkey));
	const defaultThreshold = 2;
	const defaultSelected = 3;
	const minThreshold = 2;
	let threshold = 3;
	let total = Math.min(4, signers.length);

	const analytics = new WizardAnalyticsClient();

	function toggleAdvancedMode() {
		advanceSignersSelection = !advanceSignersSelection;
	}

	function toggleSigner(pubkey: string) {
		if (selectedSigners.has(pubkey)) {
			// disable signer
			if (selectedSigners.size > threshold) {
				selectedSigners.delete(pubkey);
				selectedSigners = selectedSigners;
				// if we remove a signer and total is now greater than selected signers, adjust it
				if (total > selectedSigners.size) {
					total = selectedSigners.size;
					// now if threshold is greater than total adjust it too
					if (threshold > total) {
						threshold = total;
					}
				}
			}
		} else {
			// enable signer
			selectedSigners.add(pubkey);
			selectedSigners = selectedSigners;
		}
	}

	function incrementThreshold() {
		console.log('threshold', threshold);
		console.log('selectedSigners.size', selectedSigners.size);
		if (threshold >= selectedSigners.size) {
			threshold = minThreshold;
		} else {
			threshold++;
		}
	}

	function incrementTotal() {
		if (total >= selectedSigners.size) {
			total = threshold;
		} else {
			total++;
		}
	}

	// Reference to the container element
	let advancedButtonContainer: HTMLDivElement;

	function updateEventListeners() {
		if (!advancedButtonContainer) return;

		// Remove old event listeners first
		advancedButtonContainer.querySelectorAll('button.threshold-button').forEach((button) => {
			button.removeEventListener('click', incrementThreshold);
			// Re-add the event listener
			button.addEventListener('click', incrementThreshold);
		});

		// Remove old event listeners first
		advancedButtonContainer.querySelectorAll('button.total-button').forEach((button) => {
			button.removeEventListener('click', incrementTotal);
			// Re-add the event listener
			button.addEventListener('click', incrementTotal);
		});
	}

	// Run after each update to ensure event listeners are current
	afterUpdate(updateEventListeners);

	onMount(async () => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($sessionId.length === 0) {
			goto(`/${$currentLanguage}/`);
			return;
		}

		await analytics.startStep('bunker');
	});

	async function activate(event: Event) {
		event.preventDefault();
		bunkerActivating = true;

		let intv = setInterval(() => {
			if (activationProgress < 98) activationProgress++;
		}, 3000);

		try {
			let accountEvt = await shardGetBunker(
				pool,
				$sk,
				$pk,
				advanceSignersSelection ? threshold : defaultThreshold,
				advanceSignersSelection ? total : defaultSelected,
				advanceSignersSelection ? Array.from(selectedSigners) : signers.map((s) => s.pubkey),
				$coordinator,
				20,
				$inboxes,
				$inboxes[$pk] || selectReadRelays(),
				minePow,
				(p: number) => {
					activationProgress = p;
				},
				(signer) => {
					console.log('signer ok:', signer);
				}
			);

			// automatically create the first profile, with full access (republish the updated event)
			const secretRand = new Uint8Array(10);
			window.crypto.getRandomValues(secretRand);
			const secret = base32.encode(secretRand);
			accountEvt.created_at++;
			accountEvt.tags.push(['profile', 'MAIN', secret, '']);
			accountEvt = finalizeEvent(accountEvt, $sk);
			const [pub] = pool.publish([$coordinator], accountEvt);
			await pub;

			$bunkerURI = `bunker://${accountEvt.tags.find((t) => t[0] === 'h')![1]}?relay=${encodeURIComponent($coordinator)}&secret=${secret}`;
			bunkerActivating = false;
		} catch (err) {
			console.error(err);
			alert(err);
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

	async function navigateContinue() {
		await analytics.completeStep(
			activateBunker
				? {
						signers: selectedSigners.size,
						threshold: threshold
					}
				: undefined,
			!activateBunker,
			$skipFollow
		);

		if ($skipFollow) {
			if ($callingAppCode) {
				goto(`/${$currentLanguage}/back`);
			} else {
				goto(`/${$currentLanguage}/finish`);
			}
		} else {
			goto(`/${$currentLanguage}/follow`);
		}
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
						{t('bunker.title1')}
					</div>
					<div
						class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]"
						id="tw"
					>
						{t('bunker.title2')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">
					{@html t(
						'bunker.side1',
						'class="italic"',
						'href="https://www.youtube.com/watch?v=ReN0kMzDFro" target="_blank" class="underline"'
					)}
				</p>
				<p class="mt-6">
					{@html t('bunker.side2', 'class="italic"', 'class="italic"')}
				</p>
				<p class="mt-6">
					{@html t('bunker.side3', 'class="italic"', 'class="italic"')}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive" class="text-neutral-700 dark:text-neutral-300">
		{#if $bunkerURI === ''}
			<div class=" mt-6">
				{#if !$forceBunker}
					<div>
						<CheckboxWithLabel
							bind:checked={activateBunker}
							disabled={bunkerActivating || !isWasmSupported()}
						>
							{t('bunker.label_check1')}
						</CheckboxWithLabel>
					</div>
				{/if}
			</div>
			{#if !isWasmSupported()}
				<div class="mt-6 bg-amber-100 p-2 dark:bg-amber-900">
					{t('shared.text_nowasm')}
				</div>
			{/if}
			{#if activateBunker}
				{#if !advanceSignersSelection}
					<div class="mt-6">
						{@html t(
							'bunker.text1',
							`${advanceSignersSelection ? selectedSigners.size : defaultSelected}`,
							`${defaultThreshold}`
						)}
					</div>
					<div class="mt-4">{t('bunker.text2')}</div>
				{/if}
				{#if advanceSignersSelection}
					<hr class="mt-6 border-2" />
					<div class="mt-2">{t('bunker.text3')}</div>
					<div class="mt-4">
						<div class="space-y-2">
							{#each signers as signer}
								<CheckboxWithLabel
									checked={selectedSigners.has(signer.pubkey)}
									onClick={() => toggleSigner(signer.pubkey)}
									disabled={selectedSigners.size <= threshold && selectedSigners.has(signer.pubkey)}
									>{signer.name}</CheckboxWithLabel
								>
							{/each}
						</div>
						<div class="mt-4">
							{#if selectedSigners.size < minThreshold}
								{t(
									'bunker.text4',
									`${minThreshold - selectedSigners.size}`,
									minThreshold - selectedSigners.size === 1
										? `${t('bunker.text4b')}`
										: `${t('bunker.text4c')}`
								)}
							{:else if selectedSigners.size == 2 && minThreshold == 2}
								{t('bunker.text5')}
							{:else}
								<div bind:this={advancedButtonContainer}>
									{@html t(
										'bunker.text6',
										`<button class="threshold-button cursor-pointer text-accent underline hover:no-underline">${threshold}</button>`,
										`<button class="total-button cursor-pointer text-accent underline hover:no-underline">${total}</button>`
									)}
								</div>
							{/if}
						</div>
						{#if threshold == total}
							<div class="mt-2">
								{@html t('bunker.text7')}
							</div>
						{/if}
					</div>
				{/if}

				<button
					class="text-strongpink mt-4 text-left text-sm underline"
					on:click={() => toggleAdvancedMode()}
				>
					{advanceSignersSelection ? t('bunker.switch2') : t('bunker.switch1')}
				</button>
			{/if}
			{#if bunkerActivating || $bunkerURI !== ''}
				<div class="mt-6">
					<LoadingBar progress={activationProgress} />
				</div>
			{/if}
		{/if}

		{#if $bunkerURI !== ''}
			<div class="flex h-24 justify-center text-neutral-700 dark:text-neutral-300">
				<DoneIcon />
			</div>
			<div class="mt-10 text-neutral-600 dark:text-neutral-300">
				{@html t('bunker.text8')}
			</div>
			<div class="mt-6 text-xl">
				<div class="break-words">
					<ClipToCopy textToCopy={$bunkerURI} confirmMessage="Copied!" />
				</div>
			</div>
			<button
				on:click={downloadBunker}
				class="mt-4 inline-flex w-full items-center justify-center rounded bg-accent px-8 py-3 text-[1.3rem] text-white"
			>
				{t('bunker.button_save')}
				<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-5 w-5 rotate-90" />
			</button>
		{/if}

		{#if activateBunker && $bunkerURI === ''}
			<div class="mt-16 flex justify-center sm:justify-end">
				<ContinueButton
					onClick={activate}
					disabled={bunkerActivating}
					text={bunkerActivating ? t('bunker.button_activating') : t('bunker.button_activate')}
				/>
			</div>
		{/if}

		{#if $bunkerURI !== '' || !activateBunker}
			<div class="mt-16 flex justify-center sm:justify-end">
				<ContinueButton
					onClick={navigateContinue}
					disabled={false}
					text={$bunkerURI !== '' ? t('shared.button_continue') : t('bunker.button_skip')}
				/>
			</div>
		{/if}
	</div>
</TwoColumnLayout>
