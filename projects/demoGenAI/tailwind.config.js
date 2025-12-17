/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['variant', [
    '@media (prefers-color-scheme: dark) { &:not(.light):not(.fedex) }',
    '&.dark'
  ]],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // FedEx brand colors
        'fedex-purple': {
          DEFAULT: '#4D148C',
          light: '#6B1FB3',
          dark: '#3A0F68',
          50: '#F5F0FA',
          100: '#E8DCF2',
          200: '#D1B9E5',
          300: '#A87ACC',
          400: '#7F3BB3',
          500: '#4D148C',
          600: '#3A0F68',
          700: '#2D0C51',
          800: '#1F083A',
          900: '#120523',
        },
        'fedex-orange': {
          DEFAULT: '#FF6600',
          light: '#FF8533',
          dark: '#CC5200',
          50: '#FFF4E6',
          100: '#FFE0B3',
          200: '#FFCC80',
          300: '#FFB84D',
          400: '#FF991A',
          500: '#FF6600',
          600: '#CC5200',
          700: '#993D00',
          800: '#662900',
          900: '#331400',
        },
      },
    },
  },
  plugins: [
    // Custom plugin for FedEx theme variant
    function({ addVariant }) {
      addVariant('fedex', '.fedex &');
    }
  ],
}
