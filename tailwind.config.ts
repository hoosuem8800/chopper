import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		screens: {
			'xs': '480px',
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
		},
		fontFamily: {
			'poppins': ['Poppins', 'sans-serif'],
			'opensans': ['Open Sans', 'sans-serif'],
		},
		extend: {
			colors: {
				border: 'var(--border-color)',
				input: 'var(--border-color)',
				ring: 'var(--primary-color)',
				background: 'var(--background-color)',
				foreground: 'var(--text-color)',
				primary: {
					DEFAULT: 'var(--primary-color)',
					foreground: '#ffffff'
				},
				secondary: {
					DEFAULT: 'var(--diagnostic-cyan)',
					foreground: '#ffffff'
				},
				destructive: {
					DEFAULT: 'var(--error-color)',
					foreground: '#ffffff'
				},
				muted: {
					DEFAULT: 'var(--hover-color)',
					foreground: 'var(--text-muted)'
				},
				accent: {
					DEFAULT: 'var(--hover-color)',
					foreground: 'var(--text-color)'
				},
				popover: {
					DEFAULT: 'var(--card-bg)',
					foreground: 'var(--text-color)'
				},
				card: {
					DEFAULT: 'var(--card-bg)',
					foreground: 'var(--text-color)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background)',
					foreground: 'var(--text-color)',
					primary: 'var(--primary-color)',
					'primary-foreground': '#ffffff',
					accent: 'var(--hover-color)',
					'accent-foreground': 'var(--text-color)',
					border: 'var(--border-color)',
					ring: 'var(--primary-color)'
				},
				success: 'var(--success-color)',
				warning: 'var(--warning-color)',
				error: 'var(--error-color)',
				'deep-medical': 'var(--deep-medical)',
				'scan-glow': 'var(--scan-glow)',
				'highlight-blue': 'var(--highlight-blue)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-slow': {
					'0%, 100%': { opacity: '0.3' },
					'50%': { opacity: '0.7' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'scan-line': {
					'0%': { transform: 'translateY(0%)' },
					'100%': { transform: 'translateY(100%)' }
				},
				'scan-up-down': {
					'0%, 100%': { transform: 'translateY(0%)' },
					'50%': { transform: 'translateY(100%)' }
				},
				'confetti': {
					'0%': { transform: 'translateY(-10px)', opacity: '1' },
					'100%': { transform: 'translateY(200px)', opacity: '0' }
				},
				'scale-up': {
					'0%': { transform: 'scale(0.8)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.8)', opacity: '0' },
					'50%': { transform: 'scale(1.05)', opacity: '0.8' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'scanner-line': {
					'0%': { transform: 'translateY(0)', opacity: '0.7' },
					'50%': { transform: 'translateY(400px)', opacity: '0.9' },
					'100%': { transform: 'translateY(0)', opacity: '0.7' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
				'float': 'float 5s ease-in-out infinite',
				'scan-line': 'scan-line 2s linear infinite',
				'scan-up-down': 'scan-up-down 4s ease-in-out infinite',
				'confetti-slow': 'confetti 5s ease-out forwards',
				'confetti-medium': 'confetti 4s ease-out forwards',
				'confetti-fast': 'confetti 3s ease-out forwards',
				'scale-up': 'scale-up 0.5s ease-out forwards',
				'bounce-in': 'bounce-in 0.6s ease-out forwards',
				'scanner-line': 'scanner-line 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-primary': 'linear-gradient(to right, var(--primary-color), var(--diagnostic-cyan))',
			}
		}
	},
	plugins: [
		animate,
		({ addBase }: { addBase: Function }) => {
			addBase({
				':root': {
					// These variables are now moved to index.css with light/dark variants
				},
			});
		}
	],
	safelist: [
		{
			pattern: /^(bg|text|border|ring)-(primary|secondary|success|error|warning|highlight-blue)\/\d+/,
		},
		{
			pattern: /^(bg|text|border|ring)-(primary|secondary|success|error|warning|highlight-blue)/,
		},
		{
			pattern: /^(ring-opacity)-\d+/,
		},
	],
} satisfies Config;
