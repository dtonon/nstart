import { get } from 'svelte/store';
import { type NostrEvent, type UnsignedEvent } from '@nostr/tools';
import { SimplePool } from 'nostr-tools/pool';
import { nip19 } from '@nostr/tools';
import { readRelays, writeRelays } from '$lib/store';

import HashWorker from './worker?worker';

export const signers = [
	// {
	// 	name: 'fiatjafhome1',
	// 	pubkey: '77ff8d1f2b88ea5a468036d393beef09dc01b4d770c7d4f0c4198f404aa1ffe2'
	// },
	// {
	// 	name: 'fiatjafhome2',
	// 	pubkey: '19c048b360209beb47344b45bf581f57c30e603946febf10e03534d81ab8a507'
	// },
	// {
	// 	name: 'fiatjafhome3',
	// 	pubkey: '97a7491f73155d04f209374b144646e3cb89db25f03146b58c572cd1e2d93567'
	// },

	{
		pubkey: '4440e4f93c9dcb0a5521f0bf949a1222698b72a1b1e3534b10537100fc94f97f',
		name: 'Artur Brugeman'
	},
	{
		pubkey: '23a3ff76766f5ffc852fa6f2fc5058c1306ee25927632e0f8e213af11a5b8de5',
		name: 'fiatjaf'
	},
	{
		pubkey: 'aa4f53d8041b88adee44cefb62fb49fdeb85d151d1a346e655850c213508ed2e',
		name: 'hodlbod'
	},
	{
		pubkey: 'ad1c6fa1daca939685d34ab541fc9e7b450ef6295aa273addafee74a579d57fb',
		name: 'Sebastix'
	},
	{
		pubkey: '3fcd012e970d9dfba4bc638ae9b6420e2ceca76f3b8e31d0ee3f408023a7c5fd',
		name: 'Pablo'
	},
	{
		pubkey: '4be49a6175734b43c7083ceac11e47bf684ffe65bd021c949bea1702409c119a',
		name: 'Daniele'
	}
];

export const indexRelays = [
	'wss://purplepag.es',
	'wss://user.kindpag.es',
	'wss://relay.nostr.band',
	'wss://relay.nos.social',
	'wss://relay.damus.io',
	'wss://relay.primal.net',
	'wss://indexer.coracle.social'
];

export async function minePow(
	unsigned: UnsignedEvent,
	difficulty: number,
	onBetterHash: (pow: number) => void
): Promise<Omit<NostrEvent, 'sig'>> {
	const workers: Worker[] = [];
	const nWorkers = 4;
	let best = 0;
	return new Promise((resolve) => {
		for (let i = 0; i < nWorkers; i++) {
			const worker = new HashWorker();
			workers.push(worker);
			worker.postMessage({ evt: unsigned, difficulty, start: i, step: nWorkers });
			worker.onmessage = (ev) => {
				const { pow, evt } = ev.data;
				if (pow) {
					if (pow > best) {
						onBetterHash(pow > difficulty ? difficulty : pow);
						best = pow;
					}
				} else {
					resolve(evt);
					workers.forEach((w) => w.terminate());
				}
			};
		}
	});
}

export function selectWriteRelays(): string[] {
	const currentWriteRelays = get(writeRelays);

	if (currentWriteRelays && currentWriteRelays.length > 0) {
		return currentWriteRelays;
	}

	const writeRelaysSelection = [
		'wss://relay.damus.io',
		'wss://offchain.pub',
		'wss://nostr.mom',
		'wss://nos.lol',
		'wss://relay.primal.net'
	];

	const urls = [];
	urls.push(pick(writeRelaysSelection));
	urls.push(pick(writeRelaysSelection));
	urls.push(pick(writeRelaysSelection));
	return urls;
}

export function selectReadRelays(): string[] {
	const currentReadRelays = get(readRelays);

	if (currentReadRelays && currentReadRelays.length > 0) {
		return currentReadRelays;
	}

	const wotRelaysSelection = [
		'wss://wot.utxo.one',
		'wss://nostrelites.org',
		'wss://wot.nostr.party'
	];

	const safeRelays = ['wss://pyramid.fiatjaf.com', 'wss://nostr.wine'];

	const urls = [];
	urls.push('wss://nostr.mom');
	urls.push('wss://relay.damus.io');
	urls.push(pick(wotRelaysSelection));
	urls.push(pick(wotRelaysSelection));
	urls.push(pick(safeRelays));
	return urls;
}

function pick<A>(options: A[]): A {
	const idx = Math.floor(Math.random() * options.length);
	const sel = options[idx];
	options.splice(idx, 1);
	return sel;
}

export async function getProfile(code: string): Promise<NostrEvent | null> {
	let publicKey: string;
	if (/^(nprofile|npub)/.test(code)) {
		try {
			const { type, data } = nip19.decode(code);
			if (type === 'npub') {
				publicKey = data;
			} else if (type === 'nprofile') {
				publicKey = data.pubkey;
			}
		} catch (error) {
			console.error('Failed to decode npub:', error);
			return null;
		}
	} else if (code.length === 64) {
		publicKey = code;
	} else {
		console.error('Invalid code format');
		return null;
	}

	const pool = new SimplePool();

	return new Promise((resolve, reject) => {
		const subscription = pool.subscribeMany(
			indexRelays,
			[
				{
					kinds: [0],
					authors: [publicKey],
					limit: 1
				}
			],
			{
				onevent(event) {
					subscription.close();
					resolve(event);
				},
				onclose(error) {
					console.error(`Subscription error: ${error}`);
					subscription.close();
					reject(error);
				}
			}
		);
	});
}
