<script lang="ts">
	import BasicLayout from '$lib/BasicLayout.svelte';
</script>

<BasicLayout>
	<div slot="content">
		<!-- Welcome title -->
		<div class="mb-8 border-l-[0.9rem] border-strongpink pl-4 sm:-ml-8">
			<h1 class="font-bold">
				<div class="text-[3rem] leading-[1em] text-neutral-500 sm:text-[6rem]">WELCOME</div>
				<div class="break-words text-[3.5rem] leading-[1em] sm:h-auto sm:text-[7rem]" id="tw">
					<span class="text-neutral-400">TO</span> NOSTR
				</div>
			</h1>
		</div>

		<!-- Intro text -->
		<div class="text-[1.3rem] leading-7 text-neutral-700 sm:w-[80%]">
			<p class="">
				To join Nostr you need a “profile”, but it is not the usual one that a company generates and
				manages for you. You manage the protocol.
			</p>
			<p class="mt-6">
				Nostr is a different and freedom experience from the beginning: it empowers user using
				cryptographic key-pairs that don’t require a third part; don’t worry about the tech slang,
				it is just a strong password that you will have to keep safe.
			</p>
			<p class="mt-6">
				This wizard is one of the many way to bootstrap a Nostr profile that you can use anywhere,
				we help you to create you key-pair and safely manage it in 3 easy steps. Are you ready?
			</p>
		</div>

		<!-- Start button -->
		<div class="my-8 flex justify-center sm:justify-end">
			<a
				class="inline-flex items-center rounded bg-strongpink px-10 py-3 text-[1.6rem] text-white"
				href="/yourself"
			>
				Let's Start <img src="/icons/arrow-right.svg" alt="Icon" class="ml-4 mr-2 h-8 w-8" />
			</a>
		</div>

		<!-- Footer -->
		<div class="leading-6 text-neutral-500">
			Would you like to know more about Nostr, first?<br class="hidden sm:inline-block" />
			<a href="https://njump.me" class="underline">Read a quick introduction</a>
		</div>
	</div>
</BasicLayout>
