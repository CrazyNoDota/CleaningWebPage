import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Shine X: deep cyan/blue with mint-green highlights from the new logo.
        brand: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#24d6c6',
          500: '#00a7d8',
          600: '#0088c7',
          700: '#006b9f',
          800: '#07516f',
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
