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
        cyberBg: "#05070c",
        cyberCard: "rgba(20, 30, 55, 0.45)",
        cyberBorder: "rgba(255, 255, 255, 0.08)",
        cyberBlue: "#00e5ff",
        cyberGold: "#e5a93b",
        cyberAmber: "#f59e0b",
        // 타입별 색상
        earth: "#e5a93b",
        light: "#f5e025",
        water: "#25c0f5",
        biology: "#f52588",
        nature: "#25f564",
        weather: "#d8e0e8",
        motion: "#f55025",
        chemistry: "#a025f5",
      },
      fontFamily: {
        mono: ["Outfit", "var(--font-geist-mono)", "monospace"],
        sans: ["Noto Sans KR", "var(--font-geist-sans)", "sans-serif"],
      },
      boxShadow: {
        neonBlue: "0 0 15px rgba(0, 229, 255, 0.35)",
        neonGold: "0 0 15px rgba(229, 169, 59, 0.35)",
        glass: "0 10px 30px rgba(0, 0, 0, 0.3)",
      },
      backdropBlur: {
        cyber: "16px",
      }
    },
  },
  plugins: [],
};
export default config;
