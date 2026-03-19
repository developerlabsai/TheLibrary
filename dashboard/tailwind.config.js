/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1a1a2e',
        'navy-light': '#16213e',
        accent: '#4361ee',
        emerald: '#10b981',
      },
    },
  },
  plugins: [],
};
