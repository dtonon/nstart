<script lang="ts">
	import { onMount } from 'svelte';
	import QRCodeStyling from 'qr-code-styling';

	export let className = '';
	export let data = '';

	let qrCodeContainer: HTMLElement;

	onMount(() => {
		const qrCode = new QRCodeStyling({
			width: 160,
			height: 160,
			data: data,
			image: '/images/qrcode-nostr.png',
			dotsOptions: {
				color: '#000000',
				type: 'rounded'
			},
			backgroundOptions: {
				color: '#ffffff'
			},
			imageOptions: {
				crossOrigin: 'anonymous',
				margin: 4
			}
		});

		qrCode.append(qrCodeContainer);
	});
</script>

<div bind:this={qrCodeContainer} class={className}></div>
