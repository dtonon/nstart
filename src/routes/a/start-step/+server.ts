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
		const { stepName, sessionId } = await request.json();

		// Validate required parameters
		if (!stepName) {
			return json(
				{
					success: false,
					error: 'stepName is required'
				},
				{ status: 400 }
			);
		}

		const analytics = await getAnalyticsService();
		const stepId = await analytics.startStep(stepName, sessionId);

		return json({
			success: true,
			stepId
		});
	} catch (error) {
		console.error('Error starting step:', error);
		return json(
			{
				success: false,
				error: 'Failed to start step',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
