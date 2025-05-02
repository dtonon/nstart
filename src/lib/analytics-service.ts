import WizardAnalytics from './wizard-analytics';
import type { Database } from 'sqlite';

export interface SourceStats {
	source: string;
	sessions: number;
	completed: number;
}

export interface FunnelStep {
	step_name: string;
	total: number;
	completed: number;
	skipped: number;
}

export interface AnalyticsSummary {
	totalSessions: number;
	completedSessions: number;
	partialSessions: number;
	emailCompletedSessions: number;
	bunkerCompletedSessions: number;
	followCompletedSessions: number;
	dailyStats: DailyStats[];
	topSources: SourceStats[];
	funnelData: FunnelStep[];
}

export interface DailyStats {
	date: string;
	totalSessions: number;
	completedSessions: number;
	partialSessions: number;
}

export class AnalyticsService {
	private wizardAnalytics: WizardAnalytics;

	constructor() {
		this.wizardAnalytics = new WizardAnalytics();
	}

	/**
	 * Get analytics summary for the last 90 days
	 */
	async getAnalyticsSummary(): Promise<AnalyticsSummary> {
		await this.wizardAnalytics.initialize();
		const db = (this.wizardAnalytics as any).db as Database;

		if (!db) {
			throw new Error('Database not initialized');
		}

		// Calculate date for 90 days ago
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
		const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

		// Get overall summary data
		const totalSessions = await db.get<{ count: number }>(
			`SELECT COUNT(*) as count FROM wizard_sessions
									WHERE date(start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		const completedSessions = await db.get<{ count: number }>(
			`SELECT COUNT(*) as count FROM wizard_sessions
									WHERE completed = 1 AND date(start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		const partialSessions = await db.get<{ count: number }>(
			`SELECT COUNT(DISTINCT ws.session_id) as count
									FROM wizard_sessions ws
									JOIN wizard_steps wst ON ws.session_id = wst.session_id
									WHERE ws.completed = 0 AND date(ws.start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		// Get step-specific completions
		const emailCompletedSessions = await db.get<{ count: number }>(
			`SELECT COUNT(DISTINCT ws.session_id) as count
									FROM wizard_sessions ws
									JOIN wizard_steps wst ON ws.session_id = wst.session_id
									WHERE wst.step_name = 'email'
											AND wst.completed = 1
											AND date(ws.start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		const bunkerCompletedSessions = await db.get<{ count: number }>(
			`SELECT COUNT(DISTINCT ws.session_id) as count
									FROM wizard_sessions ws
									JOIN wizard_steps wst ON ws.session_id = wst.session_id
									WHERE wst.step_name = 'bunker'
											AND wst.completed = 1
											AND date(ws.start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		const followCompletedSessions = await db.get<{ count: number }>(
			`SELECT COUNT(DISTINCT ws.session_id) as count
									FROM wizard_sessions ws
									JOIN wizard_steps wst ON ws.session_id = wst.session_id
									WHERE wst.step_name LIKE 'follow%'
											AND wst.completed = 1
											AND date(ws.start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		// Get daily stats for the chart
		const dailyStats = await db.all<DailyStats[]>(
			`WITH dates AS (
											SELECT date(datetime('now', '-' || n || ' days')) as date
											FROM (
													WITH RECURSIVE
															cnt(n) AS (
																	SELECT 0
																	UNION ALL
																	SELECT n+1 FROM cnt
																	LIMIT 90
															)
													SELECT n FROM cnt
											)
									),
									total_sessions AS (
											SELECT date(start_time) as date, COUNT(*) as count
											FROM wizard_sessions
											WHERE date(start_time) >= date(?)
											GROUP BY date(start_time)
									),
									completed_sessions AS (
											SELECT date(start_time) as date, COUNT(*) as count
											FROM wizard_sessions
											WHERE completed = 1 AND date(start_time) >= date(?)
											GROUP BY date(start_time)
									),
									partial_sessions AS (
											SELECT date(ws.start_time) as date, COUNT(DISTINCT ws.session_id) as count
											FROM wizard_sessions ws
											JOIN wizard_steps wst ON ws.session_id = wst.session_id
											WHERE ws.completed = 0 AND date(ws.start_time) >= date(?)
											GROUP BY date(ws.start_time)
									)
									SELECT
											dates.date,
											COALESCE(ts.count, 0) as totalSessions,
											COALESCE(cs.count, 0) as completedSessions,
											COALESCE(ps.count, 0) as partialSessions
									FROM dates
									LEFT JOIN total_sessions ts ON dates.date = ts.date
									LEFT JOIN completed_sessions cs ON dates.date = cs.date
									LEFT JOIN partial_sessions ps ON dates.date = ps.date
									ORDER BY dates.date ASC`,
			[ninetyDaysAgoStr, ninetyDaysAgoStr, ninetyDaysAgoStr]
		);

		// Get top 30 sources (app integrations and referrers) with completed wizard count
		const topSources = await db.all<SourceStats[]>(
			`WITH app_sources AS (
											-- App integrations (app_name + app_type)
											SELECT
													CASE
															WHEN app_name IS NOT NULL AND app_type IS NOT NULL THEN app_name || ' (' || app_type || ')'
															WHEN app_name IS NOT NULL THEN app_name
															WHEN app_type IS NOT NULL THEN app_type
															ELSE NULL
													END as source,
													COUNT(*) as sessions,
													SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
											FROM wizard_sessions
											WHERE date(start_time) >= date(?)
													AND (app_name IS NOT NULL OR app_type IS NOT NULL)
											GROUP BY source
									),

									referrer_sources AS (
											-- Referrers
											SELECT
													referrer as source,
													COUNT(*) as sessions,
													SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
											FROM wizard_sessions
											WHERE date(start_time) >= date(?)
													AND referrer IS NOT NULL
													AND app_name IS NULL
													AND referrer != ''
											GROUP BY referrer
									),

									all_sources AS (
											SELECT source, sessions, completed FROM app_sources
											UNION ALL
											SELECT source, sessions, completed FROM referrer_sources
									)

									SELECT
											source,
											SUM(sessions) as sessions,
											SUM(completed) as completed
									FROM all_sources
									WHERE source IS NOT NULL
									GROUP BY source
									ORDER BY sessions DESC
									LIMIT 30`,
			[ninetyDaysAgoStr, ninetyDaysAgoStr]
		);

		// Get funnel data for wizard steps
		const funnelStepNames = ['homepage', 'yourself', 'download', 'email', 'bunker', 'follow'];

		// Get counts for each step
		const stepCounts = await db.all<
			Array<{
				step_name: string;
				total: number;
				completed: number;
				skipped: number;
			}>
		>(
			`SELECT
						step_name,
						COUNT(*) as total,
						SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
						SUM(CASE WHEN skipped = 1 THEN 1 ELSE 0 END) as skipped
					FROM wizard_steps
					WHERE step_name IN ('homepage', 'yourself', 'download', 'email', 'bunker', 'follow')
						AND date(entered_time) >= date(?)
					GROUP BY step_name`,
			[ninetyDaysAgoStr]
		);

		// Get total completed sessions to check for missing steps
		const totalSessionsWithSteps = await db.all<Array<{ session_id: string; completed: number }>>(
			`SELECT ws.session_id, ws.completed
					FROM wizard_sessions ws
					WHERE date(ws.start_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		// Map to track which sessions have follow or bunker steps
		const sessionSteps = new Map<string, Set<string>>();

		// Get all steps for all sessions
		const allSessionSteps = await db.all<Array<{ session_id: string; step_name: string }>>(
			`SELECT session_id, step_name
					FROM wizard_steps
					WHERE date(entered_time) >= date(?)`,
			[ninetyDaysAgoStr]
		);

		// Populate the sessionSteps map
		for (const { session_id, step_name } of allSessionSteps) {
			if (!sessionSteps.has(session_id)) {
				sessionSteps.set(session_id, new Set());
			}
			sessionSteps.get(session_id)?.add(step_name);
		}

		// Process the funnel data with special handling for bunker and follow steps
		const funnelData: FunnelStep[] = [];

		// Create a map of existing step data
		const stepDataMap = new Map<string, { total: number; completed: number; skipped: number }>();
		for (const step of stepCounts) {
			stepDataMap.set(step.step_name, {
				total: step.total,
				completed: step.completed,
				skipped: step.skipped
			});
		}

		// Make sure the homepage has at least the totalSessions count
		const totalSessionsCount = totalSessions?.count || 0;
		if (!stepDataMap.has('homepage') || stepDataMap.get('homepage')!.total < totalSessionsCount) {
			stepDataMap.set('homepage', {
				total: totalSessionsCount,
				completed: totalSessionsCount,
				skipped: 0
			});
		}

		// Initialize funnel steps with data from DB
		for (const stepName of funnelStepNames) {
			const stepData = stepDataMap.get(stepName) || { total: 0, completed: 0, skipped: 0 };
			funnelData.push({
				step_name: stepName,
				total: stepData.total,
				completed: stepData.completed,
				skipped: stepData.skipped
			});
		}

		// Process each session to handle missing bunker and follow steps
		for (const { session_id, completed } of totalSessionsWithSteps) {
			const steps = sessionSteps.get(session_id) || new Set();

			// Check if session is completed but missing bunker step
			if (completed && !steps.has('bunker')) {
				// Find bunker in funnelData and increment skipped
				const bunkerStep = funnelData.find((s) => s.step_name === 'bunker');
				if (bunkerStep) {
					bunkerStep.skipped += 1;
					bunkerStep.total += 1;
				}
			}

			// Check if session is completed but missing follow step
			if (completed && !steps.has('follow')) {
				// Find follow in funnelData and increment skipped
				const followStep = funnelData.find((s) => s.step_name === 'follow');
				if (followStep) {
					followStep.skipped += 1;
					followStep.total += 1;
				}
			}
		}

		await this.wizardAnalytics.close();

		return {
			totalSessions: totalSessions?.count || 0,
			completedSessions: completedSessions?.count || 0,
			partialSessions: partialSessions?.count || 0,
			emailCompletedSessions: emailCompletedSessions?.count || 0,
			bunkerCompletedSessions: bunkerCompletedSessions?.count || 0,
			followCompletedSessions: followCompletedSessions?.count || 0,
			dailyStats: dailyStats || [],
			topSources: topSources || [],
			funnelData
		};
	}
}
