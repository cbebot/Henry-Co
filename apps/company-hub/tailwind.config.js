/** @type {import('tailwindcss').Config} */
// Owned type — flag-gated font families (platform defaults until the reveal flag).
const onyxLive =
  process.env.EXPO_PUBLIC_ONYX_TYPE_LIVE === "1" ||
  process.env.NEXT_PUBLIC_ONYX_TYPE_LIVE === "1";
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: onyxLive ? ["HenryOnyxSans"] : ["System"],
        serif: onyxLive ? ["HenryOnyxSerif"] : ["serif"],
        mono: onyxLive ? ["HenryOnyxMono"] : ["monospace"],
      },
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
