<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sk, pk, npub, password, email, name, ncryptsec } from '$lib/store';
	import { isMobile } from '$lib/mobile';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import CheckboxWithLabel from '$lib/CheckboxWithLabel.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import { sendEmail } from '$lib/actions';

	let wantEmailBackup = false;
	let emailInput: HTMLInputElement;
	let needsPassword = true;
	let activationProgress = 0;

	onMount(() => {
		needsPassword = !$password || $password == '';
	});

	const smtpFromEmail = import.meta.env.VITE_SMTP_FROM_EMAIL;

	$: if (wantEmailBackup && emailInput) {
		setTimeout(() => {
			emailInput.focus();
		}, 10); // Use a timeout to ensure the DOM has updated
	}

	onMount(() => {
		if ($name.length === 0) {
			goto('/');
		}
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

		setTimeout(() => {
			goto('/bunker');
		}, 1000);
	}

	function navigateContinue() {
		goto('/bunker');
	}
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-strongpink pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div class="text-[3rem] leading-[1em] text-neutral-500 sm:text-[3rem]">EMAIL</div>
					<div class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[3.5rem]" id="tw">
						BACKUP
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 sm:w-[90%]">
				<p class="mt-6">
					We offer you the possibility to send your encrypted <em class="italic">nsec</em> (so
					actually a <em class="italic">ncryptsec</em>) to your email address to have another
					convenient backup location.<br />
				</p>
				<p class="mt-6">
					{#if needsPassword}
						Just pick a strong password and keep it safe, write it down now, make sure you don't
						lose it.
					{:else}
						We will use the same password you picked up previously. You wrote it down, right? :)
					{/if}
				</p>
				<p class="mt-6">
					You will receive an email from {smtpFromEmail}. If you see nothing, check your spam folder.
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		<div class=" mt-6">
			<div>
				<CheckboxWithLabel bind:checked={wantEmailBackup} disabled={activationProgress > 0}>
					I want to send my encrypted nsec {#if !needsPassword}(with the same password already
						entered previously){/if} to the following email address:
				</CheckboxWithLabel>
			</div>
			<!-- svelte-ignore a11y-autofocus -->
			<input
				bind:this={emailInput}
				id="email"
				type="email"
				placeholder="Your email address"
				bind:value={$email}
				autofocus={!$isMobile}
				disabled={!wantEmailBackup || activationProgress > 0}
				class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 px-4 py-2 text-xl focus:border-neutral-700 focus:outline-none"
			/>

			{#if needsPassword}
				<input
					type="text"
					placeholder="Pick a password"
					bind:value={$password}
					disabled={!wantEmailBackup || activationProgress > 0}
					class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 px-4 py-2 text-xl focus:border-neutral-700 focus:outline-none"
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
				<button
					on:click={send}
					disabled={$ncryptsec === '' || activationProgress > 0}
					class={`inline-flex items-center rounded px-8 py-3 text-[1.6rem] text-white sm:text-[1.3rem] ${$password && $password !== '' && $email && $email !== '' && activationProgress == 0 ? 'bg-strongpink text-white' : 'cursor-not-allowed bg-neutral-400 text-neutral-100'}`}
				>
					{activationProgress > 0 ? 'Sending...' : 'Send now'}
					<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-6 w-6" />
				</button>
			{:else}
				<button
					on:click={navigateContinue}
					class="inline-flex items-center rounded bg-strongpink px-8 py-3 text-[1.6rem] text-white sm:text-[1.3rem]"
				>
					No, thanks, continue
					<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-6 w-6" />
				</button>
			{/if}
		</div>
	</div>
</TwoColumnLayout>
