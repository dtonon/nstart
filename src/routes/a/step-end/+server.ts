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
		const { stepId, skipped, options, completeSession } = await request.json();

		// Validate required parameters
		if (!stepId) {
			return json(
				{
					success: false,
					error: 'stepId is required'
				},
				{ status: 400 }
			);
		}

		const analytics = await getAnalyticsService();

		// Complete the step
		await analytics.completeStep(stepId, skipped || false, options || {});

		// If the completeSession flag is set, also complete the session
		if (completeSession) {
			const completed = completeSession === true || completeSession === 'completed';
			const db = analytics['db'];
			if (db) {
				const existingSession = await db.get(
					'SELECT session_id FROM wizard_steps WHERE step_id = ?',
					[stepId]
				);
				await analytics.completeSession(completed, existingSession.session_id);
			} else {
				return json(
					{
						success: false,
						error: 'DB missing'
					},
					{ status: 500 }
				);
			}
		}

		return json({
			success: true
		});
	} catch (error) {
		console.error('Error completing step:', error);
		return json(
			{
				success: false,
				error: 'Failed to complete step',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
