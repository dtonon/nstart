<script lang="ts">
	import { onMount } from 'svelte';
	import * as nip19 from '@nostr/tools/nip19';
	import { goto } from '$app/navigation';
	import {
		sk,
		bunkerURI,
		ncryptsec,
		callingAppName,
		callingAppType,
		callingAppCode
	} from '$lib/store';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import { name, npub } from '$lib/store';

	let loginToken;
	let actionURL: string;

	onMount(() => {
		if ($name.length === 0) {
			goto('/');
		}

		if ($bunkerURI.length > 0) {
			loginToken = $bunkerURI;
		} else if ($ncryptsec.length > 0) {
			loginToken = $ncryptsec;
		} else {
			loginToken = nip19.nsecEncode($sk);
		}

		switch ($callingAppType) {
			case 'web':
				actionURL = `${$callingAppCode}/auto-login`;
				break;
			case 'android':
				actionURL = `intent:${loginToken}#Intent;scheme=nostr-login;package=${$callingAppCode};end;`;
				break;
			case 'ios':
				actionURL = `${$callingAppCode}://${loginToken}`;
				break;
		}
	});

	async function postToLogin(event) {
		event.preventDefault();

		try {
			const response = await fetch(actionURL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ token: loginToken })
			});

			if (!response.ok) {
				throw new Error('Network error');
			}

			const _ = await response.json();
			window.location.href = actionURL;
		} catch (error) {
			console.error('Error:', error);
		}
	}
</script>

<BasicLayout>
	<div slot="content" class="animate-fade1">
		<!-- Welcome title -->
		<div class="relative mb-8 border-l-[0.9rem] border-strongpink pl-4 sm:-ml-8">
			<h1 class="font-bold">
				<div class="text-[3rem] leading-[1em] text-neutral-500 sm:text-[6rem]">YOU ARE</div>
				<div class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[7rem]" id="tw">
					READY TO GO!
				</div>
			</h1>
		</div>

		<!-- Intro text -->
		<div class="text-neutral-700 sm:w-[90%]">
			<p class="text-xl sm:w-[80%]">
				We're done, <strong>{$name}</strong>! Now you can start exploring Nostr — just click
				below to go back to <strong>{$callingAppName}</strong>:
			</p>
			<div class="mt-8">
				<a
					class="inline-flex items-center rounded bg-strongpink px-6 py-4 text-[1.8rem] text-white sm:px-10"
					href={$callingAppType === 'web' ? '#' : actionURL}
					on:click={$callingAppType === 'web' ? postToLogin : void 0}
				>
					Start using Nostr <img
						src="/icons/arrow-right.svg"
						alt="Icon"
						class="ml-4 mr-2 h-7 w-7"
					/>
				</a>
			</div>
			<p class="mt-8 text-neutral-500 sm:w-[80%]">
				{$callingAppName} is only one of the 80+ applications that have already been built on Nostr,
				<a href="https://nostrapps.com" target="_blank" class="underline">discover them all</a>!
			</p>
			<p class="mt-6 sm:w-[80%]">
				This is your web profile, you can share it anywhere and with anyone:<br />
				<a href="https://njump.me/{$npub}" target="_blank" class="break-all underline"
					>njump.me/{$npub}</a
				>
			</p>
		</div>
	</div>
</BasicLayout>
