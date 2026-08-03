
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
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
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Extended color palette from the reference image
				blue: {
					50: 'hsl(var(--blue-50))',
					100: 'hsl(var(--blue-100))',
					200: 'hsl(var(--blue-200))',
					300: 'hsl(var(--blue-300))',
					400: 'hsl(var(--blue-400))',
					500: 'hsl(var(--blue-500))',
					600: 'hsl(var(--blue-600))',
					700: 'hsl(var(--blue-700))',
					800: 'hsl(var(--blue-800))',
					900: 'hsl(var(--blue-900))',
				},
				green: {
					50: 'hsl(var(--green-50))',
					100: 'hsl(var(--green-100))',
					200: 'hsl(var(--green-200))',
					300: 'hsl(var(--green-300))',
					400: 'hsl(var(--green-400))',
					500: 'hsl(var(--green-500))',
					600: 'hsl(var(--green-600))',
					700: 'hsl(var(--green-700))',
					800: 'hsl(var(--green-800))',
					900: 'hsl(var(--green-900))',
				},
				red: {
					50: 'hsl(var(--red-50))',
					100: 'hsl(var(--red-100))',
					200: 'hsl(var(--red-200))',
					300: 'hsl(var(--red-300))',
					400: 'hsl(var(--red-400))',
					500: 'hsl(var(--red-500))',
					600: 'hsl(var(--red-600))',
					700: 'hsl(var(--red-700))',
					800: 'hsl(var(--red-800))',
					900: 'hsl(var(--red-900))',
				},
				yellow: {
					50: 'hsl(var(--yellow-50))',
					100: 'hsl(var(--yellow-100))',
					200: 'hsl(var(--yellow-200))',
					300: 'hsl(var(--yellow-300))',
					400: 'hsl(var(--yellow-400))',
					500: 'hsl(var(--yellow-500))',
					600: 'hsl(var(--yellow-600))',
					700: 'hsl(var(--yellow-700))',
					800: 'hsl(var(--yellow-800))',
					900: 'hsl(var(--yellow-900))',
				},
				cyan: {
					50: 'hsl(var(--cyan-50))',
					100: 'hsl(var(--cyan-100))',
					200: 'hsl(var(--cyan-200))',
					300: 'hsl(var(--cyan-300))',
					400: 'hsl(var(--cyan-400))',
					500: 'hsl(var(--cyan-500))',
					600: 'hsl(var(--cyan-600))',
					700: 'hsl(var(--cyan-700))',
					800: 'hsl(var(--cyan-800))',
					900: 'hsl(var(--cyan-900))',
				},
				zinc: {
					50: 'hsl(var(--zinc-50))',
					100: 'hsl(var(--zinc-100))',
					200: 'hsl(var(--zinc-200))',
					300: 'hsl(var(--zinc-300))',
					400: 'hsl(var(--zinc-400))',
					500: 'hsl(var(--zinc-500))',
					600: 'hsl(var(--zinc-600))',
					700: 'hsl(var(--zinc-700))',
					800: 'hsl(var(--zinc-800))',
					900: 'hsl(var(--zinc-900))',
				},
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
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [tailwindcssAnimate],
} satisfies Config;
