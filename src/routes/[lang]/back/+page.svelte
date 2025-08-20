<script lang="ts">
	import { onMount } from 'svelte';
	import { t, currentLanguage } from '$lib/i18n';
	import { browser } from '$app/environment';
	import * as nip19 from '@nostr/tools/nip19';
	import { goto } from '$app/navigation';
	import {
		sessionId,
		accent,
		sk,
		bunkerURI,
		ncryptsec,
		callingAppName,
		callingAppType,
		callingAppCode,
		avoidNsec,
		avoidNcryptsec
	} from '$lib/store';
	import BasicLayout from '$lib/BasicLayout.svelte';
	import { name, npub } from '$lib/store';

	let loginToken;
	let actionURL: string;

	onMount(() => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($sessionId.length === 0) {
			goto(`/${$currentLanguage}/`);
			return;
		}

		if ($bunkerURI.length > 0) {
			loginToken = $bunkerURI;
		} else if ($ncryptsec.length > 0 && !$avoidNcryptsec) {
			loginToken = $ncryptsec;
		} else if ($avoidNsec) {
			loginToken = 'null';
		} else {
			loginToken = nip19.nsecEncode($sk);
		}

		switch ($callingAppType) {
			case 'modal':
				window.parent.postMessage(
					{
						type: 'WIZARD_COMPLETE',
						result: {
							nostrLogin: loginToken
						}
					},
					'*'
				);
				break;
			case 'web':
			case 'popup':
				actionURL = `${$callingAppCode}#nostr-login=${loginToken}`;
				break;
			case 'android':
				actionURL = `intent:${loginToken}#Intent;scheme=nostr-login;package=${$callingAppCode};end;`;
				break;
			case 'ios':
				actionURL = `${$callingAppCode}://${loginToken}`;
				break;
			default:
				alert('Error: Unsupported calling app type, check the baseURL config');
				return;
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
				<div
					class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[6rem]"
				>
					{t('back.title1')}
				</div>
				<div
					class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[7rem]"
					id="tw"
				>
					{t('back.title2')}
				</div>
			</h1>
		</div>

		<!-- Intro text -->
		<div class="text-neutral-700 dark:text-neutral-200 sm:w-[90%]">
			<p class="text-xl sm:w-[80%]">
				{@html t('back.text1', $name, $callingAppName)}
			</p>
			<div class="mt-8">
				<button
					on:click={$callingAppType === 'popup' ? redirectAndClose : redirectBack}
					type="submit"
					class="inline-flex items-center rounded bg-accent px-6 py-4 text-[1.8rem] text-white sm:px-10"
				>
					{@html t('back.button_back', $callingAppName)}
					<img src="/icons/arrow-right.svg" alt="Icon" class="ml-4 mr-2 h-7 w-7" />
				</button>
			</div>
			{#if $callingAppType != 'popup'}
				<p class="mt-8 text-neutral-500 dark:text-neutral-400 sm:w-[80%]">
					{@html t(
						'back.text2',
						$callingAppName,
						'href="https://nostrapps.com" target="_blank" class="underline"'
					)}
				</p>
			{/if}
			<p class="mt-6 sm:w-[80%]">
				{@html t(
					'back.text3',
					`href="https://njump.me/${$npub}" target="_blank" class="break-all underline"`,
					$npub
				)}
			</p>
		</div>
	</div>
</BasicLayout>
