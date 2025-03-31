// src/routes/api/send-email/+server.ts
import nodemailer from 'nodemailer';
import { getPow } from '@nostr/tools/nip13';
import { verifyEvent, type NostrEvent } from '@nostr/tools/pure';
import {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_SECURE,
	SMTP_USER,
	SMTP_PASS,
	SMTP_FROM_NAME,
	VITE_SMTP_FROM_EMAIL
} from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';
import { init } from 'svelte-i18n';

// Initialize i18n with default locale
init({
	fallbackLocale: 'en',
	initialLocale: 'en',
	loadingDelay: 200,
	formats: {
		number: {
			scientific: { notation: 'scientific' }
		},
		date: {
			short: {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			}
		},
		time: {
			short: {
				hour: 'numeric',
				minute: 'numeric'
			}
		}
	}
});

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
	return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

export const POST: RequestHandler = async ({ request }) => {
	const i18n = get(_);
	let body: { to?: string; ncryptsec?: string; npub?: string } | null = null;
	try {
		body = await request.json();

		if (!body || typeof body !== 'object') {
			return json({ error: 'Invalid request body' }, { status: 400 });
		}

		const { to, ncryptsec, npub } = body;

		if (!to || typeof to !== 'string') {
			return json({ error: 'Missing or invalid email address' }, { status: 400 });
		}

		if (!ncryptsec || typeof ncryptsec !== 'string') {
			return json({ error: 'Missing or invalid encrypted secret' }, { status: 400 });
		}

		if (!npub || typeof npub !== 'string') {
			return json({ error: 'Missing or invalid public key' }, { status: 400 });
		}

		// Create email transporter
		const transporter = nodemailer.createTransport({
			host: SMTP_HOST,
			port: parseInt(SMTP_PORT),
			secure: SMTP_SECURE === 'yes',
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
		});

		// Verify SMTP connection
		try {
			await transporter.verify();
			console.log('SMTP connection verified successfully');
		} catch (error) {
			console.error('SMTP connection verification failed:', error);
			throw error;
		}

		// Prepare email content
		const emailContent = `
${i18n('email_server.content.greeting')}

${i18n('email_server.content.npub_intro')}
${npub}

${i18n('email_server.content.key_intro')}
${ncryptsec}

${i18n('email_server.content.password_reminder')}

${i18n('email_server.content.welcome')}

${i18n('email_server.content.ps')}
		`.trim();

		// Send email
		const info = await transporter.sendMail({
			from: `"${SMTP_FROM_NAME}" <${VITE_SMTP_FROM_EMAIL}>`,
			to: to,
			subject: i18n('email_server.subject'),
			text: emailContent,
		});

		console.log('Email sent successfully:', {
			messageId: info.messageId,
			to: to,
			response: info.response
		});

		return json({ message: i18n('email_server.responses.success') });
	} catch (error) {
		console.error('Error sending email:', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
			to: body?.to
		});
		return json({ error: i18n('email_server.responses.error') }, { status: 500 });
	}
};
