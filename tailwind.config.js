/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0b1330",
        encre: "#18213b",
        muted: "#62708a",
        cyan: "#26d4ea",
        "cyan-d": "#0aa8bd",
        violet: "#873cf4",
        fond: "#f6f7fb",
        filet: "#e4e8f1",
        amber: "#9a6700",
        "ambre-bg": "#fff6e0",
        rouge: "#b42318",
        white: "#fff",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}