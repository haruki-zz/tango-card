const withOpacity = (variable) => ({ opacityValue }) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variable}) / 1)`;
  }
  return `rgb(var(${variable}) / ${opacityValue})`;
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '960px',
      xl: '1200px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        accent: {
          50: withOpacity('--color-primary-50'),
          100: withOpacity('--color-primary-100'),
          200: withOpacity('--color-primary-200'),
          300: withOpacity('--color-primary-300'),
          400: withOpacity('--color-primary-400'),
          500: withOpacity('--color-primary-500'),
          600: withOpacity('--color-primary-600'),
          700: withOpacity('--color-primary-700'),
          800: withOpacity('--color-primary-800'),
          900: withOpacity('--color-primary-900'),
          DEFAULT: withOpacity('--color-primary-500'),
        },
        leaf: {
          50: withOpacity('--color-leaf-50'),
          100: withOpacity('--color-leaf-100'),
          200: withOpacity('--color-leaf-200'),
          300: withOpacity('--color-leaf-300'),
          400: withOpacity('--color-leaf-400'),
          500: withOpacity('--color-leaf-500'),
          DEFAULT: withOpacity('--color-leaf-300'),
        },
        ink: withOpacity('--color-ink'),
        muted: withOpacity('--color-muted'),
        subtle: withOpacity('--color-subtle'),
        canvas: withOpacity('--color-canvas'),
        panel: withOpacity('--color-panel'),
        border: withOpacity('--color-border'),
        focus: withOpacity('--color-focus'),
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'Inter', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'serif'],
        mono: [
          'SFMono-Regular',
          'Consolas',
          'Liberation Mono',
          'ui-monospace',
          'Menlo',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 12px 40px rgba(90, 52, 21, 0.08)',
        soft: '0 8px 20px rgba(196, 94, 27, 0.12)',
        focus: '0 0 0 1px rgba(240, 165, 98, 0.85), 0 8px 24px rgba(196, 94, 27, 0.12)',
      },
      borderRadius: {
        card: '12px',
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.33, 1, 0.68, 1)',
      },
    },
  },
  plugins: [],
};
