/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
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
          DEFAULT: "#f8f9ff",
          variant: "#dee3eb",
          container: {
            lowest: "#ffffff",
            low: "#f4f4f9",
            DEFAULT: "#eceef4",
            high: "#e6e8ee",
            highest: "#e0e2e8",
          },
        },
        "on-surface": {
          DEFAULT: "#1a1c1e",
          variant: "#42474d",
        },
        error: { DEFAULT: "#ba1a1a", container: "#ffdad6" },
      },
    },
  },
  plugins: [],
};
