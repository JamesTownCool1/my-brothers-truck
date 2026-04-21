/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Distinctive display font paired with a clean body font
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Brand palette - warm, utilitarian, trucking-inspired
        brand: {
          50:  '#fff8ed',
          100: '#ffefd4',
          200: '#ffdba8',
          300: '#ffbf71',
          400: '#ff9838',
          500: '#ff7a11', // primary orange - "working-class" warmth
          600: '#f05e07',
          700: '#c74608',
          800: '#9e370f',
          900: '#7f2f10',
        },
        ink: {
          50:  '#f5f5f4',
          100: '#e7e5e4',
          200: '#d6d3d1',
          500: '#78716c',
          700: '#3f3f3e',
          800: '#27272a',
          900: '#171717',
          950: '#0a0a0a',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
