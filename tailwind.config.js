/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          DEFAULT: "#74152F",
          dark: "#4F0B20",
          soft: "#8A1538",
        },
        gold: "#D9A441",
        ink: "#172033",
        subt: "#667085",
        canvas: "#F5F6F8",
        card: "#FFFFFF",
        line: "#E4E7EC",
        ok: "#16804A",
        warn: "#B7791F",
        err: "#D92D20",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(23,32,51,.04), 0 1px 3px rgba(23,32,51,.06)",
      },
      borderRadius: { xl2: "14px" },
    },
  },
  plugins: [],
};
