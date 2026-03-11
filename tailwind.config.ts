import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        accent: "var(--accent)",
        accentSoft: "var(--accent-soft)",
        line: "var(--line)",
        muted: "var(--muted)",
      },
      fontFamily: {
        display: ["var(--font-newsreader)"],
      },
    },
  },
  plugins: [],
};

export default config;
