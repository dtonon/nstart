import SQLite from 'sqlite3';
import { Database, open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { DatabaseMigrator } from './migrations';

export interface SessionParams {
	existingSessionId: string;
	languageCode: string;
	appType?: string;
	appName?: string;
	accentColor?: string;
	themeMode?: string;
	forceBunker?: boolean;
	skipBunker?: boolean;
	skipFollow?: boolean;
	avoidNsec?: boolean;
	avoidNcryptsec?: boolean;
	customReadRelays?: string[];
	customWriteRelays?: string[];
	referrer?: string;
	userAgent?: string;
}

interface StepOptions {
	[key: string]: boolean | string | number | string[] | number[];
}

interface StepStat {
	step_name: string;
	total: number;
	completed: number;
	skipped: number;
}

interface BasicStats {
	totalSessions: number;
	completedSessions: number;
	completionRate: number;
	averageStepsPerSession: number;
	stepCompletion: StepStat[];
}

interface OptionStat {
	option_name: string;
	option_type: string;
	option_value: string;
	count: number;
}

class WizardAnalytics {
	private db: Database | null = null;
	private currentSessionId: string | null = null;

	async initialize(): Promise<void> {
		if (this.db) return;

		const dbFullPath = './db/wizard-analytics.db';
		const dbDir = path.dirname('./db/wizard-analytics.db');
		if (!fs.existsSync(dbDir)) {
			fs.mkdirSync(dbDir, { recursive: true });
		}

		this.db = await open({
			filename: dbFullPath,
			driver: SQLite.Database
		});

		// Run migrations to apply schema updates
		const migrator = new DatabaseMigrator(this.db);
		await migrator.migrate();
	}

	// Start tracking a new wizard session
	async startSession(params: SessionParams): Promise<string> {
		await this.initialize();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		// If a session already exist, skip the creation of a new one
		if (params.existingSessionId) {
			const existingSession = await this.db.get(
				'SELECT session_id, completed FROM wizard_sessions WHERE session_id = ?',
				[params.existingSessionId]
			);

			if (existingSession) {
				return params.existingSessionId;
			}
		}

		// Create a new session
		const sessionId = uuidv4();
		this.currentSessionId = sessionId;

		await this.db.run(
			`INSERT INTO wizard_sessions (
        session_id, language_code, start_time, completed,
        app_type, app_name, accent_color, theme_mode,
        force_bunker, skip_bunker, skip_follow, avoid_nsec, avoid_ncryptsec,
        custom_read_relays, custom_write_relays, referrer, user_agent
      ) VALUES (?, ?, datetime('now'), 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				sessionId,
				params.languageCode,
				params.appType || null,
				params.appName || null,
				params.accentColor || null,
				params.themeMode || null,
				params.forceBunker ? 1 : 0,
				params.skipBunker ? 1 : 0,
				params.skipFollow ? 1 : 0,
				params.avoidNsec ? 1 : 0,
				params.avoidNcryptsec ? 1 : 0,
				params.customReadRelays ? JSON.stringify(params.customReadRelays) : null,
				params.customWriteRelays ? JSON.stringify(params.customWriteRelays) : null,
				params.referrer || null,
				params.userAgent || null
			]
		);

		return sessionId;
	}

	// Start tracking a wizard step
	async startStep(stepName: string, sessionId?: string | null): Promise<string> {
		await this.initialize();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const activeSessionId = sessionId || this.currentSessionId;
		if (!activeSessionId) {
			throw new Error('No active session. Call startSession first or provide a sessionId.');
		}

		const checkStep = await this.db.get<{ step_id: string }>(
			'SELECT step_id FROM wizard_steps WHERE session_id = ? AND step_name = ?',
			[activeSessionId, stepName]
		);

		if (checkStep) {
			console.log('Step', stepName, 'already started');
			return checkStep.step_id;
		}

		const stepId = uuidv4();

		await this.db.run(
			`INSERT INTO wizard_steps (
        step_id, session_id, step_name, completed,
        entered_time, skipped
      ) VALUES (?, ?, ?, 0, datetime('now'), 0)`,
			[stepId, activeSessionId, stepName]
		);

		return stepId;
	}

	// Complete a wizard step
	async completeStep(
		stepId: string,
		skipped: boolean = false,
		options: StepOptions = {}
	): Promise<void> {
		await this.initialize();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		// Calculate duration
		const step = await this.db.get<{ entered_time: string }>(
			'SELECT entered_time FROM wizard_steps WHERE step_id = ?',
			[stepId]
		);

		if (!step) {
			throw new Error(`Step with ID ${stepId} not found.`);
		}

		// Calculate time spent in seconds
		const enteredTimestamp = new Date(step.entered_time + 'Z');
		const currentTimestamp = new Date();
		const timeSpent = Math.floor((currentTimestamp.getTime() - enteredTimestamp.getTime()) / 1000);

		// Update step record
		await this.db.run(
			`UPDATE wizard_steps SET
        completed = ?,
        completed_time = datetime('now'),
        skipped = ?,
        time_spent_seconds = ?
      WHERE step_id = ?`,
			[skipped ? 0 : 1, skipped ? 1 : 0, timeSpent, stepId]
		);

		// Record any options provided
		for (const [optionName, optionValue] of Object.entries(options)) {
			let serializedValue: string;
			let optionType: string;

			if (Array.isArray(optionValue)) {
				serializedValue = JSON.stringify(optionValue);
				optionType = 'array';
			} else if (typeof optionValue === 'boolean') {
				serializedValue = optionValue ? '1' : '0';
				optionType = 'boolean';
			} else if (typeof optionValue === 'number') {
				serializedValue = optionValue.toString();
				optionType = 'number';
			} else {
				serializedValue = optionValue as string;
				optionType = 'string';
			}

			await this.db.run(
				`INSERT INTO step_options (
          option_id, step_id, option_name, option_value, option_type
        ) VALUES (?, ?, ?, ?, ?)`,
				[uuidv4(), stepId, optionName, serializedValue, optionType]
			);
		}
	}

	// Complete the wizard session
	async completeSession(completed: boolean, sessionId: string | null): Promise<void> {
		await this.initialize();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		const activeSessionId = sessionId || this.currentSessionId;
		if (!activeSessionId) {
			throw new Error('No active session. Call startSession first or provide a sessionId.');
		}

		// Calculate time spent in seconds
		const session = await this.db.get<{ start_time: string }>(
			'SELECT start_time FROM wizard_sessions WHERE session_id = ?',
			[activeSessionId]
		);
		if (!session) {
			throw new Error(`Session with ID ${activeSessionId} not found.`);
		}
		const enteredTimestamp = new Date(session.start_time + 'Z');
		const currentTimestamp = new Date();
		const timeSpent = Math.floor((currentTimestamp.getTime() - enteredTimestamp.getTime()) / 1000);

		await this.db.run(
			`UPDATE wizard_sessions SET
        end_time = datetime('now'),
        time_spent_seconds = ?,
        completed = ?

      WHERE session_id = ?`,
			[timeSpent, completed ? 1 : 0, activeSessionId]
		);
	}

	async close(): Promise<void> {
		if (this.db) {
			await this.db.close();
			this.db = null;
		}
	}
}

export default WizardAnalytics;
