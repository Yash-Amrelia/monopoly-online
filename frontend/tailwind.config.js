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
          dark: "#0a0712",
          darker: "#050309",
          primary: "#7c3aed",
          accent: "#fbbf24",
          success: "#10b981",
          danger: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      }
    },
  },
  plugins: [],
}
