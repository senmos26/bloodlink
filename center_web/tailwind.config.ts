/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/features/**/*.{js,ts,jsx,tsx}",
    "./src/entities/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        lexend: ["var(--font-lexend)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      screens: {
        xs: "480px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      colors: {
        primary: "#DC2626",
        "primary-dark": "#991B1B",
        "primary-light": "#FCA5A5",
        secondary: "#1F2937",
        "secondary-light": "#374151",
        accent: "#FECACA",
        light: "#F9FAFB",
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        "blood-red": "#B91C1C",
        "deep-black": "#111827",
      },
      boxShadow: {
        "blood": "0 4px 14px 0 rgba(185, 28, 28, 0.25)",
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          from: {
            backgroundPosition: "0 0",
          },
          to: {
            backgroundPosition: "-200% 0",
          },
        },
      },
    },
  },
  plugins: [],
};
