import { json } from '@sveltejs/kit';
import { AnalyticsService } from '$lib/analytics-service';

// API endpoint for fetching analytics data
// Authentication is handled in hooks.server.ts
export async function GET() {
	const analyticsService = new AnalyticsService();
	try {
		const data = await analyticsService.getAnalyticsSummary();
		return json(data);
	} catch (error) {
		console.error('Error fetching analytics data:', error);
		return json({ error: 'Failed to fetch analytics data' }, { status: 500 });
	}
}
