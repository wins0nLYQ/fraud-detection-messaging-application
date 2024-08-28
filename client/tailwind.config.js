/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/*.jsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        varela: ["'Varela Round'"], 
        quicksand: ["'Quicksand'"],
        sans: [
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ]
      }
    },
  },
  plugins: [],
}