<script lang="ts">
	import { onMount } from 'svelte';
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
	import { _ } from 'svelte-i18n';

	const isModal = getContext('isModal');

	const baseUrl = import.meta.env.VITE_BASE_URL;

	onMount(() => {
		const params = new URLSearchParams(window.location.search);

		// Set the accent color, if present, otherwise use the store default
		const accent = params.get('aa');
		if (accent) {
			$accent = accent;
		}
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		// Set forced theme if specified
		const forcedTheme = params.get('am');
		if (forcedTheme === 'light' || forcedTheme === 'dark') {
			console.log("forcedTheme =>", forcedTheme)
			$theme = forcedTheme;
		}

		// Manage suggested profiles
		const followerSuggestions = params.get('s');
		$followerSuggestions = followerSuggestions ? followerSuggestions.split(',') : [];

		// Manage return back auto-login
		const callingAppName = params.get('an');
		$callingAppName = callingAppName;
		const callingAppType = params.get('at');
		$callingAppType = callingAppType;
		const callingAppCode = params.get('ac');
		$callingAppCode = callingAppCode;

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
		const readRelays = params.get('awr');
		$readRelays = readRelays ? readRelays.split(',') : [];
		const writeRelays = params.get('arr');
		$writeRelays = writeRelays ? writeRelays.split(',') : [];

		// Manage aaf to skip following
		const skipFollow = params.get('asf');
		if (skipFollow == 'yes') {
			$skipFollow = true;
		}
	});
</script>

<svelte:head>
	<title>{$_('meta.title')}</title>
	<meta
		name="description"
		content={$_('meta.description')}
	/>
	<meta property="og:title" content={$_('meta.title')} />
	<meta
		property="og:description"
		content={$_('meta.description')}
	/>
	<meta property="og:image" content="{baseUrl}/images/relay.png" />
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
									<div class="text-[3rem] leading-[1em] sm:text-[5rem] text-black dark:text-white">{$_('welcome.title')}</div>
									<div
										class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[6rem]"
										id="tw"
									>
										<span class="text-neutral-500 dark:text-neutral-400">{$_('welcome.to')}</span>
										<span class="text-accent">{$_('welcome.nostr')}</span>
									</div>
								</h1>
							</div>

							<!-- Intro text -->
							<div
								class="animate-fade1 text-[1.3rem] leading-7 text-neutral-700 dark:text-neutral-100 opacity-0"
								style="animation-delay: 0.5s;"
							>
								<p class="">
									{$_('intro.paragraph1')}
								</p>
								<p class="mt-6">
									{$_('intro.paragraph2')}
								</p>
								<p class="mt-6">
									{#if $callingAppName}
										{@html $_('intro.paragraph3_with_app', { values: { appName: $callingAppName } })}
									{:else}
										{$_('intro.paragraph3')}
									{/if}
								</p>
							</div>

							<!-- Start button -->
							<div
								class="my-8 flex animate-fade1 justify-center opacity-0 sm:-mr-20 sm:justify-end"
								style="animation-delay: 0.7s;"
							>
								<a
									class="inline-flex items-center rounded bg-accent px-10 py-4 text-[1.8rem] text-white"
									href="/yourself"
								>
									{$_('buttons.lets_start')} <img
										src="/icons/arrow-right.svg"
										alt="Icon"
										class="ml-4 mr-2 h-7 w-7"
									/>
								</a>
							</div>

							{#if !isModal}
								<!-- Footer -->
								<div
									class="animate-fade1 leading-6 text-neutral-500 dark:text-neutral-300 opacity-0"
									style="animation-delay: 1s;"
								>
									{$_('footer.learn_more')}<br class="hidden sm:inline-block" />
									<a href="https://njump.me" class="underline">{$_('footer.read_intro')}</a>
								</div>
							{/if}
						</div>
					</div>
					<div
						class="mt-10 animate-fade1 text-center text-sm text-neutral-400 dark:text-neutral-500 opacity-0 sm:mt-4"
						style="animation-delay: 1.2s;"
					>
						{$_('footer.source_code')} <a
							href="https://github.com/dtonon/nstart"
							target="_blank"
							class="underline">{$_('footer.free_and_open')}</a
						>
					</div>
					<!-- /content -->
				</div>
			</div>
		</div>
	</div>
</div>
