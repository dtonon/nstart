/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class', // enable dark mode via class strategy
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontSize: {
				sm: ['16px', '18px'],
				base: ['18px', '20px'],
				lg: ['20px', '22px'],
				xl: ['22px', '24px']
			},
			colors: {
				accent: 'var(--accent-color)'
			},
			animation: {
				fade1: 'fadeIn 0.5s ease-in-out forwards',
				fade2: 'fadeIn 1s ease-in-out forwards',
				down: 'down 1s ease-in-out forwards',
				fade2down: 'fadeIn 1s ease-in-out, down 1s ease-in-out forwards'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: 0 },
					'100%': { opacity: 1 }
				},
				down: {
					'0%': { transform: 'translateY(-100px)' },
					'100%': { transform: 'translateY(0px)' }
				}
			}
		}
	},
	plugins: []
};
