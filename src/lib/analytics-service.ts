import WizardAnalytics from './wizard-analytics';
import type { Database } from 'sqlite';

export interface SourceStats {
	source: string;
	sessions: number;
	completed: number;
}

export interface AnalyticsSummary {
	totalSessions: number;
	completedSessions: number;
	partialSessions: number;
	dailyStats: DailyStats[];
	topSources: SourceStats[];
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

		await this.wizardAnalytics.close();

		return {
			totalSessions: totalSessions?.count || 0,
			completedSessions: completedSessions?.count || 0,
			partialSessions: partialSessions?.count || 0,
			dailyStats: dailyStats || [],
			topSources: topSources || []
		};
	}
}
