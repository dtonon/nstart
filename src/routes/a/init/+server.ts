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
		sessionId = await analytics.startSession(sessionParams);

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
