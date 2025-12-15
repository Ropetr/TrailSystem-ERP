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
        // Windows Dark Mode Colors
        dark: {
          bg: "#202020",        // Fundo principal
          card: "#2d2d2d",      // Cards, painéis
          elevated: "#383838",  // Elementos elevados
          border: "#3d3d3d",    // Bordas
          hover: "#404040",     // Hover states
          text: "#ffffff",      // Texto principal
          muted: "#a0a0a0",     // Texto secundário
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

