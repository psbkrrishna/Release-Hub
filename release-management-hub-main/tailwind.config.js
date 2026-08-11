// Copied from zm-manage-new-setting-development/tailwind.config.js so every
// class the vendored @/components/ui files use (bg-grey-1500, text-zinc-900,
// bg-blue-600, bg-purple-200, ...) resolves to the exact production value.
// Edit the source of truth there, not here, if the two need to diverge.
export default {
  content: ['./src/**/*.{js,jsx}', './index.html'],
  theme: {
    screens: {
      sm: { max: '640px' },
      md: { min: '641px' },
      lg: { min: '1280px' },
    },
    fontSize: {
      base: ['16px', '16px'],
      xs: ['12px', '14px'],
      sm: ['14px', '16px'],
      md: ['18px', '20px'],
      lg: ['20px', '22px'],
      xl: ['24px', '28px'],
    },
    extend: {
      colors: {
        green: {
          50: '#DCFFDD', 100: '#c1dcc3', 200: '#a3cba5', 300: '#7ab37c',
          400: '#60a563', 500: '#49D862', 600: '#338137', 700: '#28652b',
          800: '#1f4e21', 900: '#183c19', 1000: '#4CAF50', 1100: '#388E3C',
          1200: '#DCFFDD', 1300: '#ebf4ec',
        },
        red: {
          50: '#fcebeb', 100: '#f5c2c2', 200: '#f1a4a4', 300: '#ea7b7b',
          400: '#e66161', 500: '#e03a3a', 600: '#cc3535', 700: '#9f2929',
          800: '#7b2020', 900: '#5e1818',
        },
        yellow: {
          50: '#fbf6e8', 100: '#f3e4b6', 200: '#edd793', 300: '#e5c462',
          400: '#e0b944', 500: '#d8a715', 600: '#c59813', 700: '#99770f',
          800: '#775c0c', 900: '#5b4609', 1000: '#D8A715', 1100: '#FBF6E8',
          1200: '#FFF9E7', 1300: '#664D03',
        },
        grey: {
          50: '#e9e9e9', 100: '#bababa', 200: '#e7e7e7', 300: '#6b6b6b',
          400: '#4e4e4e', 500: '#222222', 600: '#1f1f1f', 700: '#181818',
          800: '#131313', 900: '#0e0e0e', 1000: '#183C19', 1100: '#222',
          1200: '#FAFAFA', 1300: '#DADADA', 1400: '#f1f1f1', 1500: '#F8F9FB',
          1600: '#f9fafb', 1700: '#79747E', 1800: '#f4f4f5', 1900: '#27272a',
        },
        blue: {
          50: '#e7eef6', 100: '#b4cce2', 200: '#90b3d5', 300: '#5d90c1',
          400: '#3d7ab5', 500: '#0d59a3', 600: '#0c5194', 700: '#093f74',
          800: '#07315a', 900: '#052544', 1000: '#10ADD3', 1100: '#E7F7F8',
          1200: '#0D59A3', 1300: '#E7EEF680', 1400: '#10ADD3',
        },
        primary: {
          50: '#e7eef6', 100: '#b4cce2', 200: '#90b3d5', 300: '#5d90c1',
          400: '#3d7ab5', 500: '#0d59a3', 600: '#0c5194', 700: '#093f74',
          800: '#07315a', 900: '#052544',
        },
        teal: {
          50: '#e7f7fb', 100: '#b5e6f1', 200: '#91d9eb', 300: '#5fc8e2',
          400: '#40bddc', 500: '#10add3', 600: '#0f9dc0', 700: '#0b7b96',
          800: '#095f74', 900: '#074959',
        },
        purple: {
          1000: '#BC3AD2', 1100: '#FCEBFF', 1200: '#3A0143',
        },
        gray: {
          50: '#e9e9e9', 100: '#bababa', 200: '#e7e7e7', 300: '#6b6b6b',
          400: '#4e4e4e', 500: '#222222', 600: '#1f1f1f', 700: '#181818',
          800: '#131313', 900: '#0e0e0e', 1000: '#183C19', 1100: '#222',
          1200: '#FAFAFA', 1300: '#DADADA', 1400: '#f1f1f1', 1500: '#F8F9FB',
          1600: '#f9fafb', 1700: '#79747E', 1800: '#f4f4f5', 1900: '#27272a',
        },
      },
      keyframes: {
        'fade-scale': {
          '0%, 100%': { opacity: '75%', transform: 'scale(1)' },
          '50%': { opacity: '100%', transform: 'scale(1.25)' },
        },
      },
      animation: {
        'fade-scale': 'fade-scale 1.6s ease-in infinite',
        'fade-scale-delayed-1': 'fade-scale 1.6s ease-in infinite 0.4s',
      },
      zIndex: { 1: '1', '-1': '-1' },
      borderWidth: { DEFAULT: '1px', 3: '3px' },
      spacing: {
        0.5: '0.125rem', 7.5: '1.875rem', 13: '3.25rem', 15: '3.75rem',
        17: '4.25rem', 19: '76px', 18: '4.5rem', 22: '88px', 23: '5.75rem',
        25: '6.25rem', 26: '6.5rem', 27: '6.75rem', 30: '7.5rem', 31: '7.75rem',
        33: '8.25rem', 35: '8.75rem', '1/5': '20%', 140: '560px',
      },
      minHeight: (theme) => ({ ...theme('spacing'), 175: '700px' }),
      rotate: { 22.5: '22.5deg' },
      fontFamily: {
        sans: ['var(--font-source-sans)', 'system-ui', 'sans-serif'],
      },
      lineHeight: { 'extra-tight': '1.125' },
      boxShadow: {
        sm: '0px 4px 8px rgba(75, 97, 119, 0.1)',
        m: '0px 1px 4px rgba(31, 92, 163, 0.2)',
        card: '0px 2px 10px 0px rgba(0, 0, 0, 0.03), 0px 0px 20px 0px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
