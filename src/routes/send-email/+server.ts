import { currentLanguage, setLanguage } from '$lib/i18n';
import nodemailer from 'nodemailer';
import { t } from '$lib/i18n';
import { getPow } from '@nostr/tools/nip13';
import { verifyEvent, type NostrEvent } from '@nostr/tools/pure';
import { env } from '$env/dynamic/private';

export const POST = async ({ request }: { request: Request }) => {
	try {
		const evt = JSON.parse(atob(request.headers.get('Authorization')!.substring(6))) as NostrEvent;

		// check if they have sent enough pow
		if (!verifyEvent(evt)) {
			throw 'invalid authorization event signature';
		}
		if (getPow(evt.id) < 20) {
			throw 'insufficient pow';
		}

		const { to, ncryptsec, npub } = await request.json();

		// Create a transporter object using the nodemailer library
		const transporter = nodemailer.createTransport({
			host: env.SMTP_HOST,
			port: Number(env.SMTP_PORT),
			secure: env.SMTP_SECURE === 'yes',
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS
			}
		});

		let currentLang: string;
		currentLanguage.subscribe((value) => {
			currentLang = value;
		});
		await setLanguage(currentLang!);

		// Set up email data
		const mail_options = {
			from: `"${env.SMTP_FROM_NAME}" <${env.VITE_SMTP_FROM_EMAIL}>`,
			to: to,
			subject: t('confirmation_email.subject'),
			text: t('confirmation_email.body', npub, ncryptsec)
		};

		// Send email
		const info = await transporter.sendMail(mail_options);

		// Return a Response object
		return new Response(
			JSON.stringify({
				message: 'Email sent successfully',
				messageId: info.messageId
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	} catch (error) {
		console.error(error); // Log the error for debugging
		return new Response(
			JSON.stringify({
				error: 'Internal server error'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};
