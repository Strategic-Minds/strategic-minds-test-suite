import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#F6B800",
        "gold-dark": "#D4A000",
        brand: { black: "#0A0A0A", gray: "#1A1A1A" },
      },
    },
  },
  plugins: [],
} satisfies Config;
