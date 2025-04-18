import SQLite from 'sqlite3';
import { Database, open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface SessionParams {
	languageCode: string;
	appType?: string;
	appName?: string;
	accentColor?: string;
	themeMode?: string;
	forceBunker?: boolean;
	skipBunker?: boolean;
	avoidNsec?: boolean;
	avoidNcryptsec?: boolean;
	customReadRelays?: string[];
	customWriteRelays?: string[];
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

	private readonly SESSION_STORAGE_KEY = 'wizard_analytics_session';

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

		// Create tables if they don't exist
		await this.db.exec(`
      CREATE TABLE IF NOT EXISTS wizard_sessions (
        session_id TEXT PRIMARY KEY,
        language_code TEXT,
        start_time DATETIME,
        end_time DATETIME,
        time_spent_seconds INTEGER,
        completed BOOLEAN,
        app_type TEXT,
        app_name TEXT,
        accent_color TEXT,
        theme_mode TEXT,
        force_bunker BOOLEAN,
        skip_bunker BOOLEAN,
        avoid_nsec BOOLEAN,
        avoid_ncryptsec BOOLEAN,
        custom_read_relays TEXT,
        custom_write_relays TEXT
      );

      CREATE TABLE IF NOT EXISTS wizard_steps (
        step_id TEXT PRIMARY KEY,
        session_id TEXT,
        step_name TEXT,
        entered_time DATETIME,
        completed_time DATETIME,
        time_spent_seconds INTEGER,
        completed BOOLEAN,
        skipped BOOLEAN,
        FOREIGN KEY (session_id) REFERENCES wizard_sessions(session_id)
      );

      CREATE TABLE IF NOT EXISTS step_options (
        option_id TEXT PRIMARY KEY,
        step_id TEXT,
        option_name TEXT,
        option_value TEXT,
        option_type TEXT,
        FOREIGN KEY (step_id) REFERENCES wizard_steps(step_id)
      );

      CREATE INDEX IF NOT EXISTS idx_wizard_steps_session_id ON wizard_steps(session_id);
      CREATE INDEX IF NOT EXISTS idx_step_options_step_id ON step_options(step_id);
    `);
	}

	/**
	 * Start tracking a new wizard session
	 * @param params - Session parameters
	 * @returns The session ID
	 */
	async startSession(params: SessionParams): Promise<string> {
		await this.initialize();

		if (!this.db) {
			throw new Error('Database not initialized');
		}

		// Create a new session
		const sessionId = uuidv4();
		this.currentSessionId = sessionId;

		await this.db.run(
			`INSERT INTO wizard_sessions (
        session_id, language_code, start_time, completed,
        app_type, app_name, accent_color, theme_mode,
        force_bunker, skip_bunker, avoid_nsec, avoid_ncryptsec,
        custom_read_relays, custom_write_relays
      ) VALUES (?, ?, datetime('now'), 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				sessionId,
				params.languageCode,
				params.appType || null,
				params.appName || null,
				params.accentColor || null,
				params.themeMode || null,
				params.forceBunker ? 1 : 0,
				params.skipBunker ? 1 : 0,
				params.avoidNsec ? 1 : 0,
				params.avoidNcryptsec ? 1 : 0,
				params.customReadRelays ? JSON.stringify(params.customReadRelays) : null,
				params.customWriteRelays ? JSON.stringify(params.customWriteRelays) : null
			]
		);

		return sessionId;
	}

	/**
	 * Start tracking a wizard step
	 * @param stepName - Name of the step
	 * @param sessionId - Session ID (uses current session if not provided)
	 * @returns The step ID
	 */
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

	/**
	 * Complete a wizard step
	 * @param stepId - ID of the step to complete
	 * @param skipped - Whether the step was skipped
	 * @param options - Step options to record
	 */
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
        completed_time = ?,
        skipped = ?,
        time_spent_seconds = ?
      WHERE step_id = ?`,
			[skipped ? 0 : 1, currentTimestamp, skipped ? 1 : 0, timeSpent, stepId]
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

	/**
	 * Complete the wizard session
	 * @param completed - Whether the wizard was fully completed
	 * @param sessionId - Session ID (uses current session if not provided)
	 */
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

		// Clear storage when session is completed
		if (activeSessionId === this.currentSessionId) {
			this.currentSessionId = null;
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem(this.SESSION_STORAGE_KEY);
			}
		}
	}

	/**
	 * Close the database connection
	 */
	async close(): Promise<void> {
		if (this.db) {
			await this.db.close();
			this.db = null;
		}
	}
}

export default WizardAnalytics;
