/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        ink: '#0f172a',
        muted: '#475569',
        surface: '#0b1220',
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans JP"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 12px 40px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
