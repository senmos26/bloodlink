/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit-Regular", "sans-serif"],
        regular: ["Outfit-Regular", "sans-serif"],
        medium: ["Outfit-Medium", "sans-serif"],
        semibold: ["Outfit-SemiBold", "sans-serif"],
        bold: ["Outfit-Bold", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#b80035",
          container: "#ffd9dd",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#006591",
          container: "#c6e7ff",
          foreground: "#ffffff",
        },
        tertiary: {
          DEFAULT: "#006847",
          container: "#8bf8c9",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff", // Pure white background
          variant: "#fee2e2", // Faint rose/red border tint
          container: {
            lowest: "#ffffff",
            low: "#fff8f9", // Soft rose-tinted white
            DEFAULT: "#fff1f2", // Very light rose container
            high: "#ffe4e6", // Light rose
            highest: "#fecaca", // Rose border/accent
          },
        },
        "on-surface": {
          DEFAULT: "#0f172a", // Premium slate/indigo navy (instead of black/gray)
          variant: "#3b4e68", // Deep slate blue for subtexts (instead of neutral gray)
        },
        error: { DEFAULT: "#ba1a1a", container: "#ffdad6" },
      },
    },
  },
  plugins: [],
};
