/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Cores PLANAC - Design System
        planac: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
        },
        // iOS/Samsung Dark Mode Colors
        dark: {
          bg: "#000000",        // Preto puro (fundo)
          surface: "#1c1c1e",   // Superfície (cards, sidebar)
          elevated: "#2c2c2e",  // Elementos elevados
          border: "#38383a",    // Bordas sutis
          hover: "#3a3a3c",     // Hover states
          text: "#ffffff",      // Texto principal
          secondary: "#8e8e93", // Texto secundário (cinza iOS)
          tertiary: "#636366",  // Texto terciário
        }
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
      }
    },
  },
  plugins: [],
}

