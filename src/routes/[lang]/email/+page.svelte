<script lang="ts">
	import { onMount } from 'svelte';
	import WizardAnalyticsClient from '$lib/wizard-analytics-client';
	import { t, currentLanguage } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import {
		sessionId,
		accent,
		sk,
		pk,
		npub,
		password,
		email,
		name,
		ncryptsec,
		skipBunker,
		skipFollow,
		callingAppCode
	} from '$lib/store';
	import { isMobile } from '$lib/mobile';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import CheckboxWithLabel from '$lib/CheckboxWithLabel.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import { sendEmail } from '$lib/actions';
	import { isWasmSupported } from '$lib/wasm';
	import ContinueButton from '$lib/ContinueButton.svelte';

	let wantEmailBackup = false;
	let emailInput: HTMLInputElement;
	let needsPassword = true;
	let activationProgress = 0;

	const analytics = new WizardAnalyticsClient();

	const smtpFromEmail = import.meta.env.VITE_SMTP_FROM_EMAIL;

	$: if (wantEmailBackup && emailInput) {
		setTimeout(() => {
			emailInput.focus();
		}, 10); // Use a timeout to ensure the DOM has updated
	}

	onMount(async () => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);
		needsPassword = !$password || $password == '';

		if ($sessionId.length === 0) {
			goto(`/${$currentLanguage}/`);
			return;
		}

		await analytics.startStep('email');
	});

	async function send(ev: MouseEvent) {
		ev.preventDefault();

		if (!$email || !$password) {
			alert('Please enter your email and pick a password');
			return;
		}

		const inputElement = document.getElementById('email');
		if (inputElement && !(inputElement as HTMLObjectElement).validity!.valid) {
			alert('Please double check your email');
			return;
		}

		let intv = setInterval(() => {
			if (activationProgress < 95) activationProgress = activationProgress + 5;
		}, 500);

		await sendEmail($sk, $pk, $npub, $ncryptsec, $email);
		clearInterval(intv);
		activationProgress = 100;

		await analytics.completeStep({});

		setTimeout(() => {
			goto(`/${$currentLanguage}/bunker`);
		}, 1000);
	}

	async function navigateContinue() {
		await analytics.completeStep({}, true, $skipBunker && $skipFollow);

		if ($skipBunker) {
			if ($skipFollow) {
				if ($callingAppCode) {
					goto(`/${$currentLanguage}/back`);
				} else {
					goto(`/${$currentLanguage}/finish`);
				}
			} else {
				goto(`/${$currentLanguage}/follow`);
			}
		} else {
			goto(`/${$currentLanguage}/bunker`);
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
						{t('email.title1')}
					</div>
					<div
						class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]"
						id="tw"
					>
						{t('email.title2')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="mt-6">
					{@html t('email.side1', 'class="italic"', 'class="italic"')}
				</p>
				<p class="mt-6">
					{#if needsPassword}
						{t('email.side2')}
					{:else}
						{t('email.side3')}
					{/if}
				</p>
				<p class="mt-6">
					{@html t('email.side4', smtpFromEmail)}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		<div class=" mt-6 text-neutral-700 dark:text-neutral-300">
			<div>
				<CheckboxWithLabel
					bind:checked={wantEmailBackup}
					disabled={activationProgress > 0 || !isWasmSupported()}
				>
					{t('email.label_check1', !needsPassword ? t('email.label_check1b') : '')}
				</CheckboxWithLabel>
			</div>
			{#if !isWasmSupported()}
				<div class="mt-6 bg-amber-100 p-2">
					{t('shared.text_nowasm')}
				</div>
			{/if}
			<!-- svelte-ignore a11y-autofocus -->
			<input
				bind:this={emailInput}
				id="email"
				type="email"
				placeholder={t('email.label_email')}
				bind:value={$email}
				autofocus={!$isMobile}
				disabled={!wantEmailBackup || activationProgress > 0}
				autocapitalize="off"
				class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 bg-white px-4 py-2 text-xl text-black focus:border-neutral-700 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
			/>

			{#if needsPassword}
				<input
					type="text"
					placeholder={t('email.label_password')}
					bind:value={$password}
					disabled={!wantEmailBackup || activationProgress > 0}
					autocapitalize="off"
					class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 bg-white px-4 py-2 text-xl text-black focus:border-neutral-700 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white dark:focus:border-neutral-400"
				/>
			{/if}

			{#if activationProgress > 0}
				<div class="mt-6">
					<LoadingBar progress={activationProgress} />
				</div>
			{/if}
		</div>

		<div class="mt-16 flex justify-center sm:justify-end">
			{#if wantEmailBackup}
				<ContinueButton
					onClick={send}
					disabled={$ncryptsec === '' || activationProgress > 0}
					text={activationProgress > 0 ? t('email.button_sending') : t('email.button_send')}
				/>
			{:else}
				<ContinueButton onClick={navigateContinue} disabled={false} text={t('email.button_skip')} />
			{/if}
		</div>
	</div>
</TwoColumnLayout>
