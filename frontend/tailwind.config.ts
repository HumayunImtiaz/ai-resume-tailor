import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
        },
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        heading: "#0F172A",
        body: "#475569",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        fraunces: ["var(--font-fraunces)", "serif"]
      },
      keyframes: {
        scan: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        }
      },
      animation: {
        scan: 'scan 3s linear infinite',
      }
    },
  },
  plugins: [],
};
export default config;
