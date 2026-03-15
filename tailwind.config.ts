import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-secondary": "rgb(var(--ink-secondary) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        rose: "rgb(var(--rose) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          hover: "rgba(255, 255, 255, 0.12)",
          strong: "rgba(255, 255, 255, 0.18)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "clash-left": {
          "0%": { transform: "translateX(-120%) skewX(6deg)", opacity: "0" },
          "60%": { transform: "translateX(4%) skewX(-1deg)", opacity: "1" },
          "100%": { transform: "translateX(0) skewX(0deg)", opacity: "1" },
        },
        "clash-right": {
          "0%": { transform: "translateX(120%) skewX(-6deg)", opacity: "0" },
          "60%": { transform: "translateX(-4%) skewX(1deg)", opacity: "1" },
          "100%": { transform: "translateX(0) skewX(0deg)", opacity: "1" },
        },
        "vs-slam": {
          "0%": { transform: "scale(4) rotate(-12deg)", opacity: "0" },
          "50%": { transform: "scale(0.9) rotate(2deg)", opacity: "1" },
          "70%": { transform: "scale(1.1) rotate(-1deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "crackle": {
          "0%, 100%": { opacity: "0.3" },
          "15%": { opacity: "1" },
          "30%": { opacity: "0.4" },
          "45%": { opacity: "0.9" },
          "60%": { opacity: "0.2" },
          "80%": { opacity: "0.7" },
        },
        "slot-pulse": {
          "0%, 100%": { borderColor: "rgba(212, 105, 138, 0.2)", boxShadow: "0 0 0px rgba(212, 105, 138, 0)" },
          "50%": { borderColor: "rgba(212, 105, 138, 0.5)", boxShadow: "0 0 30px rgba(212, 105, 138, 0.15)" },
        },
        "score-fill": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        "reveal-up": {
          "0%": { transform: "translateY(40px) scale(0.95)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s ease-out both",
        "fade-in": "fade-in 0.5s ease-out both",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        "clash-left": "clash-left 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "clash-right": "clash-right 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
        "vs-slam": "vs-slam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s both",
        "crackle": "crackle 0.8s ease-in-out infinite",
        "slot-pulse": "slot-pulse 2s ease-in-out infinite",
        "score-fill": "score-fill 1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "reveal-up": "reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
