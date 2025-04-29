import type { PageServerLoad } from './$types';
import { AnalyticsService } from '$lib/analytics-service';

export const load: PageServerLoad = async () => {
	const analyticsService = new AnalyticsService();
	try {
		const analyticsData = await analyticsService.getAnalyticsSummary();
		return {
			analyticsData
		};
	} catch (error) {
		console.error('Error loading analytics data:', error);
		return {
			error: 'Failed to fetch analytics data'
		};
	}
};