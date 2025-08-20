import { createSHA256 } from 'hash-wasm';
import { bytesToHex } from '@noble/curves/abstract/utils';

async function sleep(ts: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ts));
}

self.onmessage = async function (ev: MessageEvent) {
	const { evt, difficulty, start, step } = ev.data;

	let count = start;
	let i = 0;

	const tag = ['nonce', count.toString(), difficulty.toString()];

	evt.tags.push(tag);

	const hasher = await createSHA256();
	let prev = 0;

	while (true) {
		i++;
		count += step;
		tag[1] = count.toString();

		if ((i & 0xffff) === 0) {
			evt.created_at = Math.ceil(Date.now() / 1000) + 12;
		}

		hasher.init();
		hasher.update(JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]));

		const id = hasher.digest('binary');
		const pow = getPow(id);
		if (pow > prev) {
			postMessage({ pow });
			await sleep(1);

			prev = pow;

			if (pow >= difficulty) {
				evt.id = bytesToHex(id);
				break;
			}
		}
	}

	postMessage({ evt });
};

function getPow(id: Uint8Array): number {
	let count = 0;

	for (let i = 0; i < 32; i++) {
		const nibble = id[i];
		if (nibble === 0) {
			count += 8;
		} else {
			count += Math.clz32(nibble) - 24;
			break;
		}
	}

	return count;
}
