/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#eef7f8', 100:'#d4ecef', 200:'#a9d9df', 300:'#6ebfc9',
          400:'#3aa3b0', 500:'#1f8796', 600:'#0d6b7a', 700:'#0d4a58',
          800:'#0c3a47', 900:'#0a2e39',
        },
        gold: { 400:'#dbb96a', 500:'#C9A84C', 600:'#b0903e' }
      },
    },
  },
  plugins: [],
}
