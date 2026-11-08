import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        monef: {
          dark: "#080c14",
          card: "#0f1626",
          cardHover: "#141e33",
          border: "#1e2c47",
          subtle: "#94a3b8",
          accent: "#0070ba", // PayPal Blue
          cyan: "#00cfde",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e"
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(0, 207, 222, 0.25)',
        'glow-blue': '0 0 25px -5px rgba(0, 112, 186, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
