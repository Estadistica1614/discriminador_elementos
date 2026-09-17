/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pfa: {
          blue: '#17365D',
          navy: '#003366',
          dark: '#002244',
          gold: '#E6C027',
          light: '#E2E8F0',
          accent: '#341e66'
        }
      }
    },
  },
  plugins: [],
}
