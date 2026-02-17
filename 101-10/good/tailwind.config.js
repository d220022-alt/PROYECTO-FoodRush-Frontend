/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#D90429',
        secondary: '#EF233C',
        dark: '#111111',
        accent: '#F48C06',
        'accent-hover': '#E85D04', 
        cream: '#F8F9FA',
        surface: '#FFFFFF'
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
        display: ['Titan One', 'cursive'],
      }
    },
  },
  plugins: [],
}