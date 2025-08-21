<script lang="ts">
	import { onMount } from 'svelte';
	import { type NostrEvent } from '@nostr/tools';
	import WizardAnalyticsClient from '$lib/wizard-analytics-client';
	import { t, currentLanguage } from '$lib/i18n';
	import { goto } from '$app/navigation';
	import { sessionId, accent, sk, name, followerSuggestions, callingAppCode } from '$lib/store';
	import TwoColumnLayout from '$lib/TwoColumnLayout.svelte';
	import CheckboxWithLabel from '$lib/CheckboxWithLabel.svelte';
	import LoadingBar from '$lib/LoadingBar.svelte';
	import { indexRelays, getProfile } from '$lib/nostr';
	import { publishFollows } from '$lib/actions';
	import { pool } from '@nostr/gadgets/global';
	import ContinueButton from '$lib/ContinueButton.svelte';

	const FOLLOWS = [
		{
			name: 'daniele',
			pubkey: '7bdef7be22dd8e59f4600e044aa53a1cf975a9dc7d27df5833bc77db784a5805',
			image: 'https://avatars.githubusercontent.com/u/89577423'
		},
		{
			name: 'fiatjaf',
			pubkey: '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d',
			image: 'https://fiatjaf.com/static/favicon.jpg'
		},
		{
			name: 'Rabble',
			pubkey: '76c71aae3a491f1d9eec47cba17e229cda4113a0bbb6e6ae1776d7643e29cafa',
			image: 'https://i.nostr.build/ml33v.png'
		},
		{
			name: 'Pablo',
			pubkey: 'fa984bd7dbb282f07e16e7ae87b26a2a7b9b90b7246a44771f0cf5ae58018f52',
			image: 'https://m.primal.net/KwlG.jpg'
		},
		{
			name: 'Alex',
			pubkey: '9ce71f1506ccf4b99f234af49bd6202be883a80f95a155c6e9a1c36fd7e780c7',
			image: 'https://cdn.nostr.build/p/4LyD.jpg'
		},
		{
			name: 'jb55',
			pubkey: '32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245',
			image: 'https://cdn.jb55.com/img/red-me.jpg'
		},
		{
			name: 'laanwj',
			pubkey: '0aa39e5aef99a000a7bdb0b499158c92bc4aa20fb65931a52d055b5eb6dff738',
			image:
				'https://media.x0f.org/8b444ccaf9b27b36c60fa99956b337b901094fac6a8d4592268214ead0611116.jpeg'
		},
		{
			name: 'Alex Gleason',
			pubkey: '0461fcbecc4c3374439932d6b8f11269ccdb7cc973ad7a50ae362db135a474dd',
			image:
				'https://image.nostr.build/3320e9c4901646a3dd8b648d5414d8a01068e1498eb935a6b415f3a9465cdd3b.jpg'
		},
		{
			name: 'Dawn',
			pubkey: 'c230edd34ca5c8318bf4592ac056cde37519d395c0904c37ea1c650b8ad4a712',
			image: 'https://pbs.twimg.com/profile_images/1466845930876022789/weOpD4Ix.jpg'
		},
		{
			name: 'hodlbod',
			pubkey: '97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322',
			image: 'https://i.nostr.build/AZ0L.jpg'
		},
		{
			name: 'Michael Dilger',
			pubkey: 'ee11a5dff40c19a555f41fe42b48f00e618c91225622ae37b6c2bb67b76c4e49',
			image: 'https://mikedilger.com/bs.webp'
		},
		{
			name: 'Pam',
			pubkey: '0b118e40d6f3dfabb17f21a94a647701f140d8b063a9e84fe6e483644edc09cb',
			image:
				'https://nostr.build/i/p/nostr.build_15d3f5653f090ca5832c77f1583e9f698831d383862eaf1b535e7a4cb30b29ed.jpeg'
		},
		{
			name: 'Snowden',
			pubkey: '84dee6e676e5bb67b4ad4e042cf70cbd8681155db535942fcc6a0533858a7240',
			image: 'https://nostr.build/i/p/6838p.jpeg'
		},
		{
			name: 'jack',
			pubkey: '82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2',
			image:
				'https://image.nostr.build/26867ce34e4b11f0a1d083114919a9f4eca699f3b007454c396ef48c43628315.jpg'
		}
	];

	let suggestedUsers: any[] = [];
	let selectedUsers: Set<string> = new Set();
	let activationProgress = 0;

	const analytics = new WizardAnalyticsClient();

	onMount(async () => {
		document.documentElement.style.setProperty('--accent-color', '#' + $accent);

		if ($sessionId.length === 0) {
			goto(`/${$currentLanguage}/`);
			return;
		}

		suggestedUsers = await buildSuggestionList();
		await analytics.startStep('follow');
	});

	async function buildSuggestionList(): Promise<any[]> {
		const users = [];
		for (const suggestion of $followerSuggestions) {
			let profile = (await getProfile(suggestion)) as NostrEvent;
			if (profile) {
				const parsedContent = JSON.parse(profile.content);
				let name = parsedContent.name || null;
				let image = parsedContent.picture || null;
				users.push({ name: name, pubkey: profile.pubkey, image: image });
				toggleUserSelection({ pubkey: profile.pubkey });
			}
		}

		const shuffled = FOLLOWS.sort(() => 0.5 - Math.random());
		for (const random of shuffled) {
			const exists = users.some((user) => user.pubkey === random.pubkey);
			if (!exists) {
				users.push(random);
			}
			if (users.length >= 5) {
				break;
			}
		}

		return users;
	}

	function toggleUserSelection(user: { pubkey: string }) {
		if (selectedUsers.has(user.pubkey)) {
			selectedUsers.delete(user.pubkey);
		} else {
			selectedUsers.add(user.pubkey);
		}
	}

	async function getSelectedUsersArray() {
		const sources: string[] = [...selectedUsers];

		const all = new Set<string>();

		let events = await pool.querySync(indexRelays, { kinds: [3], authors: sources });
		events.forEach((e) => {
			e.tags.forEach((tag) => {
				if (tag[0] === 'p' && tag[1].match(/^[a-f0-9]{64}$/) && !sources.includes(tag[1])) {
					all.add(tag[1]);
				}
			});
		});

		const pubkeys = Array.from(all.values());
		const follows: string[][] = sources.map((pk) => ['p', pk]);
		while (follows.length < 500 && pubkeys.length > 0) {
			const pick = pubkeys.splice(
				Math.floor(Math.random() * pubkeys.length),
				Math.round(Math.random() * 15)
			);
			follows.push(...pick.map((pk) => ['p', pk]));
		}

		return follows;
	}

	async function navigateContinue() {
		let intv = setInterval(() => {
			if (activationProgress < 95) activationProgress = activationProgress + 5;
		}, 500);

		await publishFollows($sk, getSelectedUsersArray());

		activationProgress = 100;
		clearInterval(intv);

		await analytics.completeStep(
			selectedUsers.size > 0
				? {
						selected: selectedUsers.size
					}
				: undefined,
			selectedUsers.size == 0,
			true
		);

		setTimeout(() => {
			if ($callingAppCode) {
				goto(`/${$currentLanguage}/back`);
			} else {
				goto(`/${$currentLanguage}/finish`);
			}
		}, 1000);
	}
</script>

<TwoColumnLayout>
	<div slot="intro">
		<div class="w-full sm:mr-10 sm:max-w-[350px]">
			<div class="mb-8 border-l-[0.9rem] border-accent pl-4 sm:-ml-8">
				<h1 class="font-bold">
					{#if $currentLanguage === 'tr'}
						<div
							class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]"
						>
							{t('follow.title2')}
						</div>
						<div
							class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]"
							id="tw"
						>
							{t('follow.title1')}
						</div>
					{:else}
						<div
							class="text-[3rem] leading-[1em] text-neutral-500 dark:text-neutral-400 sm:text-[3rem]"
						>
							{t('follow.title1')}
						</div>
						<div
							class="break-words text-[3.5rem] leading-[1em] text-black dark:text-white sm:h-auto sm:text-[3.5rem]"
							id="tw"
						>
							{t('follow.title2')}
						</div>
					{/if}
				</h1>
			</div>

			<div class="leading-5 text-neutral-700 dark:text-neutral-300 sm:w-[90%]">
				<p class="">
					{@html t('follow.side1')}
				</p>
				<p class="mt-6">
					{t('follow.side2')}
				</p>
			</div>
		</div>
	</div>

	<div slot="interactive">
		<div class="sm:mt-20">
			<!-- list of follows -->
			<div class="text-neutral-700 dark:text-neutral-300">
				{t('follow.text1')}
			</div>
			<div class="mt-4">
				{#each suggestedUsers as user}
					<CheckboxWithLabel
						checked={selectedUsers.has(user.pubkey)}
						onClick={() => toggleUserSelection(user)}
						position="right"
						alignment="center"
					>
						<div
							class="flex items-center border-b-4 border-neutral-200 pb-4 pt-4 dark:border-neutral-700"
						>
							<div
								class="inline-block h-8 w-8 rounded-full bg-cover bg-center"
								style="background-image: url('{user.image}');"
							></div>
							<div class="ml-2 text-xl text-neutral-700 dark:text-neutral-300">{user.name}</div>
						</div>
					</CheckboxWithLabel>
				{/each}
			</div>
		</div>

		{#if activationProgress > 0}
			<div class="mt-6">
				<LoadingBar progress={activationProgress} />
			</div>
		{/if}

		<div class="mt-16 flex justify-center sm:justify-end">
			<ContinueButton
				onClick={navigateContinue}
				disabled={activationProgress > 0}
				text={activationProgress > 0 ? t('follow.button_finishing') : t('follow.button_finish')}
			/>
		</div>
	</div>
</TwoColumnLayout>
