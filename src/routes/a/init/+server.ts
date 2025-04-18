import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import WizardAnalytics from '$lib/wizard-analytics';

let analyticsService: WizardAnalytics;

async function getAnalyticsService() {
	if (!analyticsService) {
		analyticsService = new WizardAnalytics();
		await analyticsService.initialize();
	}
	return analyticsService;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const sessionParams = await request.json();

		// Validate required parameters
		if (!sessionParams.languageCode) {
			return json(
				{
					success: false,
					error: 'languageCode is required'
				},
				{ status: 400 }
			);
		}

		const analytics = await getAnalyticsService();

		let sessionId: string;

		// If we have an existing session ID, check if it's valid
		if (sessionParams.existingSessionId) {
			const db = analytics['db']; // Accessing private property

			if (db) {
				const existingSession = await db.get(
					'SELECT session_id, completed FROM wizard_sessions WHERE session_id = ?',
					[sessionParams.existingSessionId]
				);

				if (existingSession && existingSession.completed === 0) {
					// Session exists and is not completed, reuse it
					sessionId = sessionParams.existingSessionId;
				} else {
					// Start a new session if the existing one is completed or doesn't exist
					sessionId = await analytics.startSession(sessionParams);
				}
			} else {
				// If DB is not initialized, start a new session
				sessionId = await analytics.startSession(sessionParams);
			}
		} else {
			// No existing session, start a new one
			sessionId = await analytics.startSession(sessionParams);
		}

		return json({
			success: true,
			sessionId
		});
	} catch (error) {
		console.error('Error initializing session:', error);
		return json(
			{
				success: false,
				error: 'Failed to initialize session',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
