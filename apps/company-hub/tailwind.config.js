/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hub: {
          bg: "#0B0B0C",
          surface: "#141416",
          line: "#2A2A2E",
          muted: "#9A9AA3",
          gold: "#C9A227",
          "gold-dim": "#A68B1F",
        },
      },
    },
  },
  plugins: [],
};
