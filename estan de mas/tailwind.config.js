/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clan: {
          red: '#750000', // Deep Devil Red (darker base)
          brightRed: '#D60000', // Highlights
          black: '#080808', // Pure Black
          dark: '#121212', // Off-black
          white: '#ffffff',
          magenta: '#C2185B', // The specific Jersey Magenta
          pink: '#E91E63', // Lighter glow
          gold: '#FFD700', // Trophy gold
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Teko', 'sans-serif'],
      },
      backgroundImage: {
        'jersey-pattern': "repeating-linear-gradient(135deg, #080808, #080808 10px, #1a1a1a 10px, #1a1a1a 12px)",
        'card-gradient': "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 70%, rgba(0,0,0,1) 100%)",
      }
    },
  },
  plugins: [],
}