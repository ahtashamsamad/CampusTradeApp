/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        "background-dark": "#0f172a",
        "surface-dark": "#1e293b",
        "surface-highlight": "#334155",
        "text-main": "#f8fafc",
        "text-secondary": "#94a3b8",
      }
    },
  },
  plugins: [],
};
