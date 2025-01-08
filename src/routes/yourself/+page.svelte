<script lang="ts">
	import { onMount } from 'svelte';
	import { finalizeEvent, type EventTemplate } from '@nostr/tools/pure';
	import { calculateFileHash } from '@nostr/tools/nip96';
	import { utf8Encoder } from '@nostr/tools/utils';
	import { base64 } from '@scure/base';

	import { goto } from '$app/navigation';
	import { sk, pk, name, picture, about, website } from '$lib/store';
	import { isMobile } from '$lib/mobile';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import { mineEmail, publishRelayList, publishProfile } from '$lib/actions';

	let picturePreview: string | null = null;
	let activationProgress = 0;

	onMount(() => {
		if ($sk.length === 0) {
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
		const formData = new FormData();
		formData.append('uploadtype', 'avatar');
		formData.append('file', file);

		const response = await fetch('https://cdn.nostrcheck.me', {
			method: 'POST',
			headers: {
				Authorization: `Nostr ${auth}`
			},
			body: formData
		});

		if (response.ok) {
			const data = await response.json();
			activationProgress = 100;
			console.log('Upload successful:', data);
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
			<div class="mb-8 border-l-[0.9rem] border-strongpink pl-4 sm:-ml-8">
				<h1 class="font-bold">
					<div class="text-[3rem] leading-[1em] text-neutral-500 sm:text-[3rem]">HELLO</div>
					<div class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[3.5rem]" id="tw">
						WORLD
					</div>
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 sm:w-[90%]">
				<p class="">On Nostr, you can be whoever you want.</p>
				<p class="mt-6">
					A Nostr profile usually includes a name, a picture and some additional information, but
					it's all optional.
				</p>

				<p class="mt-6">
					The name is not a unique username, we can have as many Jacks as we want! Feel free to use
					your real name or a nickname; you can always change it later.<br />
					But remember: online privacy matters, don’t share sensitive data.
				</p>

				<p class="mt-6">
				        No email, no phone number, no IDs, no drama.
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		<div class="flex items-end justify-end">
			<button on:click={triggerFileInput} class="text-xl text-neutral-400">Your image</button>
			<div class="-mr-8 ml-2 mt-2 h-1 w-20 border-t-2 border-neutral-300"></div>
			<button
				on:click={triggerFileInput}
				class="input-hover-enabled h-24 w-24 rounded-full border-2 border-neutral-300 bg-neutral-100"
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
			<input
				type="text"
				placeholder="Your name"
				bind:value={$name}
				autofocus={!isMobile}
				class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 px-4 py-2 text-xl focus:border-neutral-700 focus:outline-none"
			/>
			<textarea
				placeholder="A brief presentation"
				bind:value={$about}
				class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 px-4 py-2 text-xl focus:border-neutral-700 focus:outline-none"
			></textarea>
			<input
				type="text"
				placeholder="Your website"
				bind:value={$website}
				class="input-hover-enabled mt-6 w-full rounded border-2 border-neutral-300 px-4 py-2 text-xl focus:border-neutral-700 focus:outline-none"
			/>
			{#if activationProgress > 0}
				<div class="mt-6">
					<LoadingBar progress={activationProgress} />
				</div>
			{/if}
		</div>
		<div class="mt-16 flex justify-center sm:justify-end">
			<button
				on:click={navigateContinue}
				disabled={activationProgress > 0}
				class={`inline-flex items-center rounded px-8 py-3 text-[1.6rem] text-white sm:text-[1.3rem] ${activationProgress == 0 ? 'bg-strongpink text-white' : 'cursor-not-allowed bg-neutral-400 text-neutral-100'}`}
			>
				{activationProgress > 0 ? 'Uploading...' : 'Continue'}
				<img src="/icons/arrow-right.svg" alt="continue" class="ml-4 mr-2 h-6 w-6" />
			</button>
		</div>
	</div>
</TwoColumnLayout>
