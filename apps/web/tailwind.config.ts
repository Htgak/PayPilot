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
        // Exact reference palette: Indigo/Purple primary, Cyan & Periwinkle accents
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#5B50EB", // Reference Primary Indigo
          700: "#4F46E5",
          800: "#4338CA",
          900: "#312E81",
        },
        nexus: {
          purple: "#5B50EB",
          lavender: "#7C72F2",
          blue: "#3B82F6",
          cyan: "#06B6D4",
          mint: "#00D2B4",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 2px 10px -2px rgba(0, 0, 0, 0.03), 0 1px 3px -1px rgba(0, 0, 0, 0.02)",
        cardHover: "0 12px 24px -4px rgba(91, 80, 235, 0.08), 0 4px 10px -2px rgba(0, 0, 0, 0.03)",
        glow: "0 0 25px -4px rgba(91, 80, 235, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
