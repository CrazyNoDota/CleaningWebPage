import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand palette mirrors design/reference/styles.css
        brand: {
          50: '#f0faf4', // green-bg
          100: '#d8f3dc', // green-pale
          200: '#a8d8b9',
          300: '#74c69d',
          400: '#52b788', // accent-mint
          500: '#40916c', // green-light
          600: '#2d6a4f', // green-primary (PRIMARY)
          700: '#1b4332',
          800: '#10301f',
        },
        gold: {
          DEFAULT: '#f4a261',
        },
        ink: {
          900: '#1a1a2e',
          700: '#4a4a5a',
          400: '#8a8a9a',
        },
      },
      borderRadius: {
        pill: '50px',
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.06)',
        'soft-md': '0 4px 12px rgba(0,0,0,0.08)',
        'soft-lg': '0 8px 30px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
} satisfies Config;
