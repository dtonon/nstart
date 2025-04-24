import { Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

interface Migration {
	id: number;
	name: string;
	sql: string;
}

export class DatabaseMigrator {
	private migrations: Migration[] = [
		{
			id: 0,
			name: 'initial_schema',
			sql: `
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
      `
		},
		{
			id: 1,
			name: 'add_referrer_and_user_agent',
			sql: `
        ALTER TABLE wizard_sessions ADD COLUMN referrer TEXT;
        ALTER TABLE wizard_sessions ADD COLUMN user_agent TEXT;
      `
		},
		{
			id: 2,
			name: 'add_skip_follow',
			sql: `
        ALTER TABLE wizard_sessions ADD COLUMN skip_follow BOOLEAN;
      `
		}
	];

	constructor(private db: Database) {}

	async migrate(): Promise<void> {
		// Create migrations table if it doesn't exist
		await this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT,
        applied_at DATETIME
      )
    `);

		// Get already applied migrations
		const appliedMigrations = await this.db.all<{ id: number }[]>('SELECT id FROM migrations');
		const appliedIds = new Set(appliedMigrations.map((m) => m.id));

		// Apply new migrations in order
		for (const migration of this.migrations.sort((a, b) => a.id - b.id)) {
			if (!appliedIds.has(migration.id)) {
				console.log(`Applying migration ${migration.id}: ${migration.name}`);

				try {
					await this.db.exec('BEGIN TRANSACTION');
					await this.db.exec(migration.sql);
					await this.db.run(
						'INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, datetime("now"))',
						[migration.id, migration.name]
					);
					await this.db.exec('COMMIT');
					console.log(`Migration ${migration.id} applied successfully`);
				} catch (error) {
					await this.db.exec('ROLLBACK');
					console.error(`Migration ${migration.id} failed:`, error);
					throw error;
				}
			}
		}
	}
}
