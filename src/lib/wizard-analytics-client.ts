import { sessionId } from '$lib/store';

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

class WizardAnalyticsClient {
	private currentSessionId: string | null = null;
	private currentStepId: string | null = null;

	constructor() {
		// Try to restore the session ID on initialization
		sessionId.subscribe((value) => {
			this.currentSessionId = value;
		});
	}

	/**
	 * Initialize a new analytics session
	 * @param params Session parameters
	 * @returns Promise resolving to the session ID
	 */
	async initSession(params: SessionParams): Promise<string> {
		try {
			const requestBody: any = { ...params };

			// Add referrer and user agent information from browser
			if (typeof document !== 'undefined') {
				requestBody.referrer = document.referrer || '';
			}

			if (typeof navigator !== 'undefined') {
				requestBody.userAgent = navigator.userAgent || '';
			}

			// If we already have a session ID, send it with the request
			if (this.currentSessionId) {
				requestBody.existingSessionId = this.currentSessionId;
			}

			const response = await fetch('/a/init', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error(`Failed to initialize session: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success || !data.sessionId) {
				throw new Error('Invalid response from analytics server');
			}

			this.currentSessionId = data.sessionId;

			sessionId.set(data.sessionId);

			return data.sessionId;
		} catch (error) {
			console.error('Analytics error:', error);
			return '';
		}
	}

	/**
	 * Start tracking a wizard step
	 * @param stepName Name of the step
	 * @returns Promise resolving to the step ID
	 */
	async startStep(stepName: string): Promise<string> {
		try {
			const response = await fetch('/a/start-step', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					stepName,
					sessionId: this.currentSessionId
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to start step: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success || !data.stepId) {
				throw new Error('Invalid response from analytics server');
			}

			this.currentStepId = data.stepId;
			return data.stepId;
		} catch (error) {
			console.error('Analytics error:', error);
			return '';
		}
	}

	/**
	 * Complete a wizard step
	 * @param options Step options to record
	 * @param skipped Whether the step was skipped
	 * @param completeSession Whether to also complete the session
	 */
	async completeStep(
		options: StepOptions = {},
		skipped: boolean = false,
		completeSession: boolean | 'completed' | 'abandoned' = false
	): Promise<boolean> {
		try {
			if (!this.currentStepId) {
				console.warn('No active step to complete');
				return false;
			}

			const response = await fetch('/a/step-end', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					stepId: this.currentStepId,
					skipped,
					options,
					completeSession
				})
			});

			if (!response.ok) {
				throw new Error(`Failed to complete step: ${response.status}`);
			}

			const data = await response.json();

			if (!data.success) {
				throw new Error('Invalid response from analytics server');
			}

			// Reset current step ID if successful
			this.currentStepId = null;

			return true;
		} catch (error) {
			console.error('Analytics error:', error);
			return false;
		}
	}
}

export default WizardAnalyticsClient;
