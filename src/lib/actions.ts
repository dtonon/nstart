import { finalizeEvent, type NostrEvent } from '@nostr/tools/pure';
import { indexRelays, minePow, selectReadRelays, selectWriteRelays } from './nostr';
import { pool } from '@nostr/gadgets/global';
import { inboxes } from './store';
import { get } from 'svelte/store';

export async function sendEmail(
	sk: Uint8Array,
	pk: string,
	npub: string,
	ncryptsec: string,
	email: string
) {
	// Restart mining if it has already been used
	if (mining === undefined) {
		mineEmail(sk, pk);
	}

	try {
		const response = await fetch('/send-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Nostr ' + btoa(JSON.stringify(await mining))
			},
			body: JSON.stringify({ to: email, ncryptsec, npub: npub })
		});

		const result = await response.json();
		if (!response.ok) {
			throw result.error;
		}
	} catch (err) {
		console.log('failed to send email', err);
	}
	resetMining();
}

export async function publishRelayList(sk: Uint8Array, pk: string) {
	const outboxRelays: string[] = selectWriteRelays();
	const inboxRelays: string[] = get(inboxes)[pk] || selectReadRelays();

	const tags: string[][] = [];
	for (let i = 0; i < outboxRelays.length; i++) {
		const url = outboxRelays[i];
		tags.push(['r', url, 'write']);
	}
	for (let i = 0; i < inboxRelays.length; i++) {
		const url = inboxRelays[i];
		tags.push(['r', url, 'read']);
	}

	const signedEvent = finalizeEvent(
		{
			kind: 10002,
			created_at: Math.floor(Date.now() / 1000),
			tags,
			content: ''
		},
		sk
	);
	pool.publish(indexRelays, signedEvent);
	console.log('Published ' + JSON.stringify(signedEvent));
}

export async function publishProfile(sk: Uint8Array, metadata: any) {
	const signedEvent = finalizeEvent(
		{
			kind: 0,
			created_at: Math.floor(Date.now() / 1000),
			tags: [],
			content: JSON.stringify(metadata)
		},
		sk
	);
	pool.publish(indexRelays, signedEvent);
	console.log('Published ' + JSON.stringify(signedEvent));
}

export async function publishFollows(sk: Uint8Array, follows: Promise<string[][]>) {
	const signedEvent = finalizeEvent(
		{
			kind: 3,
			created_at: Math.floor(Date.now() / 1000),
			tags: await follows,
			content: ''
		},
		sk
	);
	pool.publish(indexRelays, signedEvent);
	console.log('Published ' + JSON.stringify(signedEvent));
}

let mining: Promise<NostrEvent> | undefined;

export function resetMining() {
	mining = undefined;
}

export async function mineEmail(sk: Uint8Array, pk: string) {
	mining = minePow(
		{
			pubkey: pk,
			created_at: Math.floor(Date.now() / 1000),
			kind: 20000,
			tags: [],
			content: ''
		},
		20,
		() => {}
	).then((uevt) => finalizeEvent(uevt, sk));
}
