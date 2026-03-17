/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        coffee: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f4ddb3',
          300: '#ecc47d',
          400: '#e2a44b',
          500: '#d4882a',
          600: '#b8701f',
          700: '#92541c',
          800: '#78421e',
          900: '#63371c',
        },
        cream: {
          50: '#fafaf7',
          100: '#f5f0e8',
          200: '#ede4d0',
          300: '#dfd3b5',
        },
      },
    },
  },
  plugins: [],
}
