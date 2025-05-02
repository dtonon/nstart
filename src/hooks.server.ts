import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';

function checkBasicAuth(authHeader: string | null): boolean {
	if (!authHeader) return false;

	try {
		const base64Credentials = authHeader.split(' ')[1];
		const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
		const [username, password] = credentials.split(':');
		return username === env.ANALYTICS_USERNAME && password === env.ANALYTICS_PASSWORD;
	} catch (e) {
		return false;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Check if this is an analytics route
	if (event.url.pathname.startsWith('/analytics') || event.url.pathname === '/a/analytics') {
		const authHeader = event.request.headers.get('Authorization');

		if (!checkBasicAuth(authHeader)) {
			return new Response('Unauthorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Nstart Analytics"'
				}
			});
		}
	}

	return await resolve(event);
};
