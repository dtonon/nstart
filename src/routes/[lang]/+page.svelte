<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import WizardAnalyticsClient from '$lib/wizard-analytics-client';
	import { page } from '$app/stores';
	import { t, currentLanguage } from '$lib/i18n';
	import {
		accent,
		followerSuggestions,
		callingAppName,
		callingAppType,
		callingAppCode,
		skipBunker,
		forceBunker,
		avoidNsec,
		avoidNcryptsec,
		readRelays,
		writeRelays,
		skipFollow
	} from '$lib/store';
	import { getContext } from 'svelte';
	import { theme } from '$lib/store';

	const isModal = getContext('isModal');

	const analytics = new WizardAnalyticsClient();

	onMount(async () => {
		const params = new URLSearchParams(window.location.search);

		// Set the accent color, if present, otherwise use the store default
		const accentParam = params.get('aa');
		if (accentParam) {
			$accent = accentParam;
		}
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		// Set forced theme if specified
		const forcedTheme = params.get('am');
		if (forcedTheme === 'light' || forcedTheme === 'dark') {
			console.log('forcedTheme =>', forcedTheme);
			$theme = forcedTheme;
		}

		// Manage suggested profiles
		const followerSuggestionsParam = params.get('s');
		$followerSuggestions = followerSuggestionsParam
			? (followerSuggestionsParam.split(',') as any)
			: [];

		// Manage return back auto-login
		const callingAppNameParam = params.get('an');
		$callingAppName = callingAppNameParam || '';
		const callingAppTypeParam = params.get('at');
		$callingAppType = callingAppTypeParam || '';
		const callingAppCodeParam = params.get('ac');
		$callingAppCode = callingAppCodeParam || '';

		// If a param is missing, reset all
		if (!$callingAppName || !$callingAppType || !$callingAppCode) {
			$callingAppName = '';
			$callingAppType = '';
			$callingAppCode = '';
		}

		// Manage asb param to skip Bunker step
		const skipBunker = params.get('asb');
		if (skipBunker == 'yes') {
			$skipBunker = true;
		}

		// Manage afb param to skip Bunker step
		const forceBunker = params.get('afb');
		if (forceBunker == 'yes') {
			$forceBunker = true;
		}

		// Manage aan to avoid returning Nsec
		const avoidNsec = params.get('aan');
		if (avoidNsec == 'yes') {
			$avoidNsec = true;
		}

		// Manage aac to avoid returning Ncryptsec
		const avoidNcryptsec = params.get('aac');
		if (avoidNcryptsec == 'yes') {
			$avoidNcryptsec = true;
		}

		// Manage custom relays
		const readRelaysParam = params.get('awr');
		$readRelays = readRelaysParam ? (readRelaysParam.split(',') as any) : [];
		const writeRelaysParam = params.get('arr');
		$writeRelays = writeRelaysParam ? (writeRelaysParam.split(',') as any) : [];

		// Manage aaf to skip following
		const skipFollow = params.get('asf');
		if (skipFollow == 'yes') {
			$skipFollow = true;
		}

		let currentLang: string;
		currentLanguage.subscribe((value) => {
			currentLang = value;
		});

		await analytics.initSession({
			languageCode: currentLang!,
			appType: $callingAppType,
			appName: $callingAppName,
			accentColor: $accent,
			themeMode: $theme,
			forceBunker: $forceBunker,
			skipBunker: $skipBunker,
			skipFollow: $skipFollow,
			avoidNsec: $avoidNsec,
			avoidNcryptsec: $avoidNcryptsec,
			customReadRelays: $readRelays,
			customWriteRelays: $writeRelays
		});
	});
</script>

<svelte:head>
	<title>Create your Nostr account</title>
	<meta
		name="description"
		content="Create your Nostr account, back it up, and get a Nostr Connect bunker URL in few easy steps!"
	/>
	<meta property="og:title" content="Create your Nostr account" />
	<meta
		property="og:description"
		content="Create your Nostr account, back it up, and get a Nostr Connect bunker URL in few easy steps!"
	/>
	<meta property="og:image" content="{$page.url.origin}/images/relay.png" />
</svelte:head>

<div class="dark:bg-neutral-800">
	<div
		class="gradient max-h-max bg-white"
		style="background: linear-gradient(to top right, rgba(220, 220, 220, 0.4), rgba(255, 255, 255, 0.9)), url('/bg/noisy.png');"
	>
		<div>
			<div class="flex min-h-screen items-center justify-center">
				<div class="mx-auto py-8 sm:pt-0">
					<!-- content-->
					<div class="px-8 sm:flex sm:flex-row-reverse sm:items-center sm:p-0">
						<div
							class="flex animate-fade2down justify-center sm:relative sm:h-screen sm:basis-[45vw] sm:overflow-hidden"
						>
							{#if !isModal}
								<img
									src={`/images/${$theme === 'dark' ? 'dark-relay' : 'relay'}.png`}
									class="z-0 mb-8 w-60 sm:absolute sm:-right-[20px] sm:top-[15%] sm:w-full sm:object-left"
									alt="Nostr Client"
								/>
							{/if}
						</div>

						<div class="z-20 basis-[55%] sm:py-10 sm:pl-[16vw]">
							<!-- Welcome title -->
							<div
								class="mb-8 animate-fade2 border-l-[0.9rem] border-accent pl-4 opacity-0 sm:-ml-8"
								style="animation-delay: 0.2s;"
							>
								<h1 class="font-bold">
									{#if $currentLanguage === 'ja'}
										<div
											class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[6rem]"
											id="tw"
										>
											<span class="text-accent">{t('home.title1')}</span>
											<span class="text-neutral-500 dark:text-neutral-400">{t('home.title2')}</span>
										</div>
										<div
											class="text-[3rem] leading-[1em] text-black dark:text-white sm:text-[5rem]"
										>
											{t('home.title3')}
										</div>
									{:else}
										<div
											class="text-[3rem] leading-[1em] text-black dark:text-white sm:text-[5rem]"
										>
											{t('home.title1')}
										</div>
										<div
											class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[6rem]"
											id="tw"
										>
											<span class="text-neutral-500 dark:text-neutral-400">{t('home.title2')}</span>
											<span class="text-accent">{t('home.title3')}</span>
										</div>
									{/if}
								</h1>
							</div>

							<!-- Intro text -->
							<div
								class="animate-fade1 text-[1.3rem] leading-7 text-neutral-700 opacity-0 dark:text-neutral-100"
								style="animation-delay: 0.5s;"
							>
								<p class="">
									{t('home.text1')}
								</p>
								<p class="mt-6">
									{t('home.text2')}
								</p>
								<p class="mt-6">
									{#if $callingAppName}
										{@html t('home.text3a', $callingAppName)}
									{:else}
										{t('home.text3b')}
									{/if}
								</p>
							</div>

							<!-- Start button -->
							<div
								class="my-8 flex animate-fade1 justify-center opacity-0 sm:-mr-20 sm:justify-end"
								style="animation-delay: 0.7s;"
							>
								<button
									class="inline-flex items-center rounded bg-accent px-10 py-4 text-[1.8rem] text-white"
									on:click={() => goto('/en/yourself')}
								>
									{t('home.button_start')}
									<img src="/icons/arrow-right.svg" alt="Icon" class="ml-4 mr-2 h-7 w-7" />
								</button>
							</div>

							{#if !isModal}
								<!-- Footer -->
								<div
									class="animate-fade1 leading-6 text-neutral-500 opacity-0 dark:text-neutral-300"
									style="animation-delay: 1s;"
								>
									{t('home.footer1')}<br class="hidden sm:inline-block" />
									<a href="https://njump.me" class="underline">{t('home.footer2')}</a>
								</div>
							{/if}
						</div>
					</div>
					<div
						class="mt-10 animate-fade1 text-center text-sm text-neutral-400 opacity-0 dark:text-neutral-500 sm:mt-4"
						style="animation-delay: 1.2s;"
					>
						{@html t(
							'home.footer3',
							'href="https://github.com/dtonon/nstart" target="_blank" class="underline"'
						)}
					</div>
					<!-- /content -->
				</div>
			</div>
		</div>
	</div>
</div>
