/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#b3ccff',
          300: '#82abff',
          400: '#5384ff',
          500: '#3661f5',
          600: '#2547d0',
          700: '#1e3aa8',
          800: '#1c3286',
          900: '#1b2c6b',
        },
      },
    },
  },
  plugins: [],
};
