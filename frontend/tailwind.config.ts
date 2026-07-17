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
        ink: {
          navy: "#14213D"
        },
        amber: {
          DEFAULT: "#E8A33D"
        },
        parchment: {
          DEFAULT: "#FAF6ED"
        }
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
