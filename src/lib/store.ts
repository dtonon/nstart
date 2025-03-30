import { derived, readable, writable, type Readable, type Writable } from 'svelte/store';
import { generateSecretKey, getPublicKey } from '@nostr/tools/pure';
import { npubEncode } from '@nostr/tools/nip19';
import * as nip49 from '@nostr/tools/nip49';
import { signers } from './nostr';
import { loadRelayList } from '@nostr/gadgets/lists';

// Utility function to handle sessionStorage
function createSessionWritable<T>(label: string, initialValue: T): Writable<T> {
	const isBrowser = typeof window !== 'undefined';

	let data;

	if (isBrowser) {
		const storedValue = sessionStorage.getItem(label);
		if (storedValue) {
			const parsedValue = JSON.parse(storedValue);
			if (parsedValue.type === 'Uint8Array') {
				data = base64ToUint8Array(parsedValue.value);
			} else {
				data = parsedValue.value;
			}
		} else {
			data = initialValue;
		}
	} else {
		data = initialValue;
	}

	const store = writable<T>(data);

	if (isBrowser) {
		store.subscribe((value) => {
			let storageValue;
			if (value instanceof Uint8Array) {
				const base64String = uint8ArrayToBase64(value);
				storageValue = JSON.stringify({ type: 'Uint8Array', value: base64String });
			} else if (value instanceof Array) {
				storageValue = JSON.stringify({ type: 'array', value: value });
			} else {
				storageValue = JSON.stringify({ type: 'string', value: value });
			}
			sessionStorage.setItem(label, storageValue);
		});
	}

	return store;
}

// Convert Uint8Array to Base64
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
	let binaryString = '';
	for (let i = 0; i < uint8Array.length; i++) {
		binaryString += String.fromCharCode(uint8Array[i]);
	}
	return btoa(binaryString);
}

// Convert Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

// Utility function to persist values in localStorage
function createLocalWritable<T>(label: string, initialValue: T): Writable<T> {
	const isBrowser = typeof window !== 'undefined';
	let data = initialValue;
	if (isBrowser) {
		const storedValue = localStorage.getItem(label);
		if (storedValue) {
			try {
				const parsed = JSON.parse(storedValue);
				data = parsed.value;
			} catch (e) {
				data = initialValue;
			}
		}
	}
	const store = writable<T>(data);
	if (isBrowser) {
		store.subscribe(value => {
			localStorage.setItem(label, JSON.stringify({ type: typeof value, value }));
		});
	}
	return store;
}

// Stores with session persistence
export const sk = createSessionWritable<Uint8Array>('sk', generateSecretKey());
export const name = createSessionWritable('name', '');
export const about = createSessionWritable('about', '');
export const email = createSessionWritable('email', '');
export const picture = createSessionWritable('picture', '');
export const website = createSessionWritable('website', '');
export const password = createSessionWritable('password', '');
export const bunkerURI = createSessionWritable('bunker', '');
export const backupDownloaded = createSessionWritable('backupDownloaded', false);
export const followerSuggestions = createSessionWritable('followerSuggestions', []);
export const callingAppName = createSessionWritable('callingAppName', '');
export const callingAppType = createSessionWritable('callingAppType', '');
export const callingAppCode = createSessionWritable('callingAppCode', '');
export const skipBunker = createSessionWritable('skipBunker', false);
export const forceBunker = createSessionWritable('forceBunker', false);
export const avoidNsec = createSessionWritable('avoidNsec', false);
export const avoidNcryptsec = createSessionWritable('avoidNcryptsec', false);
export const readRelays = createSessionWritable('readRelays', []);
export const writeRelays = createSessionWritable('writeRelays', []);
export const skipFollow = createSessionWritable('skipFollow', false);
export const accent = createSessionWritable('accent', 'e32a6d');
export const theme = createLocalWritable('theme', ''); // Empty = system

// Runtime stores
export const inboxes = readable<{ [pubkey: string]: string[] }>({}, (set) => {
	const inboxes: { [pubkey: string]: string[] } = {};
	Promise.all(
		signers.map(async (pk) => {
			try {
				const rl = await loadRelayList(pk);
				if (rl && rl.items) {
					inboxes[pk] = rl.items.filter((r) => r.read).map((r) => r.url);
				} else {
					inboxes[pk] = [];
				}
			} catch (err) {
				console.error('failed to load inbox relays for', pk, err);
				inboxes[pk] = [];
			}
		})
	).then(() => {
		set(inboxes);
	});
});

// Derived stores
export const pk = derived<Readable<Uint8Array>, string>(sk, getPublicKey);
export const npub = derived(pk, npubEncode);

let ncryptsecTimeoutId: NodeJS.Timeout;
export const ncryptsec = derived<[Readable<Uint8Array>, Readable<string>], string>(
	[sk, password],
	([sk, password], set) => {
		if (ncryptsecTimeoutId) {
			clearTimeout(ncryptsecTimeoutId);
		}

		if (password === '') {
			set('');
			return;
		}

		ncryptsecTimeoutId = setTimeout(() => {
			set(nip49.encrypt(sk, password));
		}, 1000);
	}
);
