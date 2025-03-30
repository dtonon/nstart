<script lang="ts">
	import { onMount } from 'svelte';
	import { finalizeEvent, type EventTemplate } from '@nostr/tools/pure';
	import { calculateFileHash } from '@nostr/tools/nip96';
	import { utf8Encoder } from '@nostr/tools/utils';
	import { base64 } from '@scure/base';

	import { goto } from '$app/navigation';
	import { accent, sk, pk, name, picture, about, website } from '$lib/store';
	import { isMobile } from '$lib/mobile';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import ContinueButton from '$lib/ContinueButton.svelte';
	import { mineEmail, publishRelayList, publishProfile } from '$lib/actions';
	import { isWasmSupported } from '$lib/wasm';
	import { _ } from 'svelte-i18n';

	let picturePreview: string | null = null;
	let activationProgress = 0;

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);
		if ($sk.length === 0 && isWasmSupported()) {
			mineEmail($sk, $pk);
		}
	});

	function triggerFileInput() {
		document.getElementById('image')?.click();
	}

	function previewImage(event: Event & { currentTarget: HTMLInputElement }) {
		const file = event.currentTarget.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = () => {
				picturePreview = reader.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	async function blossomAuth(file: File) {
		// Calculate the hash of the image
		let imageHash = await calculateFileHash(file);

		// Create the event and sign it
		let eventTemplate: EventTemplate = {
			kind: 24242,
			created_at: Math.floor(Date.now() / 1000),
			tags: [
				['t', 'upload'],
				['x', imageHash],
				['expiration', String(Math.floor(Date.now() / 1000) + 86400)]
			],
			content: 'Upload profile pic'
		};
		let signedEvent = finalizeEvent(eventTemplate, $sk);

		// Return a base64 of the json event
		return base64.encode(utf8Encoder.encode(JSON.stringify(signedEvent)));
	}

	async function uploadImage(file: File) {
		let auth = await blossomAuth(file);
		const arrayBuffer = await file.arrayBuffer();

		const response = await fetch('https://cdn.nostrcheck.me/upload', {
			method: 'PUT',
			headers: {
				Authorization: `Nostr ${auth}`
			},
			body: arrayBuffer
		});

		if (response.ok) {
			const data = await response.json();
			activationProgress = 100;
			return data;
		} else {
			console.error('Upload failed:', response.statusText);
			alert('Image upload failed. Please try again.');
		}
	}

	async function navigateContinue() {
		if (!$name) {
			alert('Please enter a name, bio and website are optional');
			return;
		}

		const file = (document.getElementById('image') as HTMLInputElement).files?.[0];

		if (file) {
			let intv = setInterval(() => {
				if (activationProgress < 95) activationProgress = activationProgress + 10;
			}, 500);

			try {
				let data = await uploadImage(file); // Wait for the upload to complete
				$picture = data.url;
			} catch (error) {
				console.error('Error during upload:', error);
			}
			clearInterval(intv);
		}

		publishProfile($sk, {
			name: $name,
			about: $about,
			picture: $picture,
			website:
				$website.trim() === '' ? '' : $website.startsWith('http') ? $website : `https://${$website}`
		});
		publishRelayList($sk, $pk);

		goto('/download');
	}
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]">{$_('preset')}</div>
					<div class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[7rem]" id="tw">
						{$_('yourself')}
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">{$_('yourself_page.intro.decide')}</p>
				<p class="mt-6">
					{$_('yourself_page.intro.profile_info')}
				</p>

				<p class="mt-6">
					{$_('yourself_page.intro.name_explanation')}<br />
					{$_('yourself_page.intro.privacy_note')}
				</p>

				<p class="mt-6">
					{$_('yourself_page.intro.kyc_free')}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		<div class="mb-6 flex items-end justify-end">
			<button on:click={triggerFileInput} class="text-xl text-neutral-400 dark:text-neutral-500">{$_('yourself_page.form.image')}</button>
			<div class="-mr-8 ml-2 mt-2 h-1 w-20 border-t-2 border-neutral-300 dark:border-neutral-600"></div>
			<button
				on:click={triggerFileInput}
				class="input-hover-enabled h-24 w-24 rounded-full border-2 border-neutral-300 dark:border-neutral-600 bg-neutral-100 dark:bg-neutral-800"
			>
				<!-- svelte-ignore a11y-img-redundant-alt -->
				{#if picturePreview || $picture}
					<img
						src={picturePreview || $picture}
						alt="Profile Picture"
						class="h-full w-full rounded-full object-cover"
					/>
				{:else}
					<img
						src="/icons/pfp.svg"
						alt="Default Profile Picture"
						class="h-full w-full rounded-full object-cover"
					/>
				{/if}
			</button>
		</div>
		<div>
			<!-- File input for image upload -->
			<input type="file" id="image" accept="image/*" on:change={previewImage} class="hidden" />
			<!-- svelte-ignore a11y-autofocus -->
			<div class="mb-1 flex items-end justify-between">
				{#if $name != ''}<label for="name" class="ml-4 text-xs uppercase text-neutral-700 dark:text-neutral-300"
						>{$_('form.nickname.label')}</label
					>{:else}<div></div>{/if}
				<div class="mr-4 text-right text-xs uppercase text-neutral-500 dark:text-neutral-400">{$_('form.nickname.required')}</div>
			</div>
			<input
				id="name"
				type="text"
				placeholder={$_('form.nickname.placeholder')}
				bind:value={$name}
				autofocus={!isMobile}
				class="input-hover-enabled mb-4 w-full rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-xl text-black dark:text-white focus:border-neutral-700 dark:focus:border-neutral-400 focus:outline-none"
			/>
			<div class="mb-1 flex items-end justify-between">
				{#if $about != ''}<label for="about" class="ml-4 text-xs uppercase text-neutral-700 dark:text-neutral-300"
						>{$_('form.about.label')}</label
					>{:else}<div></div>{/if}
				<div class="mr-4 text-right text-xs uppercase text-neutral-400 dark:text-neutral-600">{$_('form.about.optional')}</div>
			</div>
			<textarea
				id="about"
				placeholder={$_('form.about.placeholder')}
				bind:value={$about}
				class="input-hover-enabled mb-4 w-full rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-xl text-black dark:text-white focus:border-neutral-700 dark:focus:border-neutral-400 focus:outline-none"
			></textarea>
			<div class="mb-1 flex items-end justify-between">
				{#if $website != ''}<label for="about" class="ml-4 text-xs uppercase text-neutral-700 dark:text-neutral-300"
						>{$_('form.website.label')}</label
					>{:else}<div></div>{/if}
				<div class="mr-4 text-right text-xs uppercase text-neutral-400 dark:text-neutral-600">{$_('form.website.optional')}</div>
			</div>
			<input
				type="text"
				placeholder={$_('form.website.label')}
				bind:value={$website}
				class="input-hover-enabled w-full rounded border-2 border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-4 py-2 text-xl text-black dark:text-white focus:border-neutral-700 dark:focus:border-neutral-400 focus:outline-none"
			/>
			{#if activationProgress > 0}
				<div class="mt-6">
					<LoadingBar progress={activationProgress} />
				</div>
			{/if}
		</div>
		<div class="mt-16 flex justify-center sm:justify-end">
			<ContinueButton
				onClick={navigateContinue}
				disabled={activationProgress > 0 || !$name}
				text={activationProgress > 0 ? $_('yourself_page.form.uploading') : $_('yourself_page.form.continue')}
			/>
		</div>
	</div>
</TwoColumnLayout>
