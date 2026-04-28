/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#fcd34d', // Amber 300
          dark: '#1f2937',   // Gray 800
          light: '#fef9c3',  // Yellow 100 (for paper background)
        }
      }
    },
  },
  plugins: [],
}
