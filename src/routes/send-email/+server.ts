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

export const POST: RequestHandler = async ({ request }) => {
	const i18n = get(_);
	try {
		const { event, email, password } = await request.json();

		// Verify the event
		if (!verifyEvent(event)) {
			return json({ error: 'Invalid authorization event' }, { status: 400 });
		}

		// Check if the event has enough proof of work
		const pow = event.tags.find((tag: [string, string]) => tag[0] === 'nonce')?.[1];
		if (!pow || parseInt(pow) < 20) {
			return json({ error: 'Insufficient proof of work' }, { status: 400 });
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

		// Prepare email content
		const emailContent = `
${i18n('email_server.content.greeting')}

${i18n('email_server.content.npub_intro')}
${event.pubkey}

${i18n('email_server.content.key_intro')}
${password}

${i18n('email_server.content.password_reminder')}

${i18n('email_server.content.welcome')}

${i18n('email_server.content.ps')}
		`.trim();

		// Send email
		await transporter.sendMail({
			from: `"${SMTP_FROM_NAME}" <${VITE_SMTP_FROM_EMAIL}>`,
			to: email,
			subject: i18n('email_server.subject'),
			text: emailContent,
		});

		return json({ message: i18n('email_server.responses.success') });
	} catch (error) {
		console.error('Error sending email:', error);
		return json({ error: i18n('email_server.responses.error') }, { status: 500 });
	}
};
