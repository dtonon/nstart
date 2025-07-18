type WizardConfig = {
	onComplete?: (result: { nostrLogin: string; npub: string }) => void;
	onCancel?: () => void;
	width?: string;
	height?: string;
	baseUrl?: string;
	an: string;
	aa?: string;
	al?: string;
	am?: 'light' | 'dark' | 'system';
	s?: string[];
	asb?: boolean;
	afb?: boolean;
	aan?: boolean;
	aac?: boolean;
	awr?: string[];
	arr?: string[];
	ahc?: boolean;
};

export class NstartModal {
	private container!: HTMLDivElement;
	private iframe!: HTMLIFrameElement;
	private closeButton!: HTMLButtonElement;
	private config: WizardConfig;
	private baseURL: string;
	private mediaQuery: MediaQueryList | null = null;
	private currentTheme: 'light' | 'dark' = 'light';

	constructor(config: WizardConfig) {
		if (!config.an) {
			throw new Error('NstartModal requires the an (appName) param');
		}

		config.baseUrl = config.baseUrl || window.location.origin;

		this.config = {
			onComplete: () => {},
			onCancel: () => {},
			width: '600px',
			height: '80vh',
			baseUrl: window.location.origin,
			...config
		};

		if (window.matchMedia) {
			this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			this.currentTheme = this.mediaQuery.matches ? 'dark' : 'light';
			if (this.config.am) {
				this.currentTheme = this.config.am as 'light' | 'dark';
			}
		}

		this.setupModal();
		this.setupMessageHandling();
		this.baseURL = this.buildURL();
	}

	private buildURL(): string {
		const url = new URL(this.config.baseUrl || window.location.origin);
		url.searchParams.set('an', this.config.an);
		url.searchParams.set('at', 'modal');
		url.searchParams.set('ac', 'modal');

		if (this.config.al) url.searchParams.set('al', this.config.al);
		if (this.config.aa) url.searchParams.set('aa', this.config.aa);
		if (this.config.am) url.searchParams.set('am', this.config.am);
		if (this.config.s?.length) url.searchParams.set('s', this.config.s.join(','));
		if (this.config.asb) url.searchParams.set('asb', 'yes');
		if (this.config.afb) url.searchParams.set('afb', 'yes');
		if (this.config.aan) url.searchParams.set('aan', 'yes');
		if (this.config.aac) url.searchParams.set('aac', 'yes');
		if (this.config.awr?.length) url.searchParams.set('awr', this.config.awr.join(','));
		if (this.config.arr?.length) url.searchParams.set('arr', this.config.arr.join(','));
		if (this.config.aac) url.searchParams.set('asf', 'yes');

		if (!this.config.ahc) this.config.ahc = false;

		return url.toString();
	}

	private updateTheme(theme: 'light' | 'dark') {
		if (!this.closeButton || !this.iframe) return;

		this.currentTheme = theme;

		this.closeButton.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${theme === 'dark' ? '#1a1a1a' : 'white'};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      box-shadow: 0 2px 4px ${theme === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'};
    `;

		const svg = this.closeButton.querySelector('svg');
		if (svg) {
			svg.style.stroke = theme === 'dark' ? 'white' : 'black';
		}

		this.iframe.style.background = theme === 'dark' ? '#1a1a1a' : 'white';
	}

	private setupModal() {
		this.container = document.createElement('div');
		this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: none;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    `;

		const modalWrapper = document.createElement('div');
		modalWrapper.style.cssText = `
      position: absolute;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
      ${
				window.innerWidth >= 768
					? `
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: ${this.config.width};
          height: ${this.config.height};
          border-radius: 8px;
        `
					: `
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        `
			}
    `;

		if (!this.config.ahc) {
			this.closeButton = document.createElement('button');
			this.closeButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      `;

			this.closeButton.addEventListener('click', () => {
				this.config.onCancel?.();
				this.close();
			});

			modalWrapper.appendChild(this.closeButton);
		}

		this.iframe = document.createElement('iframe');
		this.iframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: inherit;
      background: ${this.currentTheme === 'dark' ? '#1a1a1a' : 'white'};
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    `;

		this.iframe.addEventListener('load', () => {
			// Fade in the iframe after it's loaded
			setTimeout(() => {
				this.iframe.style.opacity = '1';
				modalWrapper.style.opacity = '1';
				this.container.style.opacity = '1';
			}, 50);
		});

		modalWrapper.appendChild(this.iframe);
		this.container.appendChild(modalWrapper);
		document.body.appendChild(this.container);

		this.updateTheme(this.currentTheme);

		window.addEventListener('resize', () => {
			modalWrapper.style.cssText = `
        position: absolute;
        opacity: ${modalWrapper.style.opacity};
        transition: opacity 0.3s ease-in-out;
        ${
					window.innerWidth >= 768
						? `
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${this.config.width};
            height: ${this.config.height};
            border-radius: 8px;
          `
						: `
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          `
				}
      `;
		});
	}

	private setupMessageHandling() {
		if (this.mediaQuery) {
			const sendThemeToIframe = (isDark: boolean) => {
				if (this.iframe?.contentWindow) {
					const theme = isDark ? 'dark' : 'light';
					this.updateTheme(theme);
					this.iframe.contentWindow.postMessage(
						{
							type: 'THEME_UPDATE',
							systemTheme: theme,
							configuredTheme: this.config.am || 'system'
						},
						'*'
					);
				}
			};

			const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
				sendThemeToIframe(e.matches);
			};

			this.mediaQuery.addEventListener('change', handleThemeChange);

			this.iframe.addEventListener('load', () => {
				handleThemeChange(this.mediaQuery!);
			});
		}

		window.addEventListener('message', (event) => {
			if (!this.config.baseUrl) return;

			const baseOrigin = new URL(this.config.baseUrl).origin;
			if (event.origin !== baseOrigin) return;

			switch (event.data.type) {
				case 'THEME_UPDATE':
					this.updateTheme(event.data.systemTheme);
					break;
				case 'WIZARD_COMPLETE':
					this.config.onComplete?.(event.data.result);
					console.log('Running sessionStorage.clear()');
					if (this.iframe?.contentWindow) {
						this.iframe.contentWindow.postMessage(
							{ type: 'CLEAR_SESSION_STORAGE' },
							this.config.baseUrl
						);
					}
					this.close();
					break;
				case 'WIZARD_CANCEL':
					this.config.onCancel?.();
					this.close();
					break;
			}
		});
	}

	private resetIframe() {
		this.iframe.src = this.baseURL;
	}

	open() {
		this.resetIframe();
		this.container.style.opacity = '0';
		this.container.style.display = 'block';
	}

	close() {
		// Fade out
		this.container.style.opacity = '0';
		setTimeout(() => {
			this.container.style.display = 'none';
			this.resetIframe();
		}, 200);
	}

	destroy() {
		this.container.remove();
	}
}

if (typeof window !== 'undefined') {
	(window as any).NstartModal = NstartModal;
}
