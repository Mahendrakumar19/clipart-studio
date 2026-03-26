/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#111118',
        border: 'rgba(255,255,255,0.06)',
        primary: '#7C3AED',
        'primary-light': '#A78BFA',
        muted: '#6B7280',
        subtle: '#9CA3AF',
      },
    },
  },
  plugins: [],
};
