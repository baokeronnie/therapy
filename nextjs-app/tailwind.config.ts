import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: "#14283A", soft: "#475A6B" },       // deep slate text (AAA on linen)
        linen: { DEFAULT: "#F4F8FB", card: "#FFFFFF", edge: "#DCE6EE" },
        sage: { 50: "#EAF4FB", 100: "#D3E8F7", 300: "#8EC5EE", 500: "#2B8FD6", 600: "#0A74B8", 700: "#0F3F66" },
        tide: { 100: "#D6ECFB", 500: "#0B84D0", 700: "#0B5F96" },
        coral: { 50: "#FDEFEB", 500: "#D4573F", 600: "#B8472F", 700: "#963725" }, // emergency only
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "1.25rem", pill: "999px" },
      boxShadow: { soft: "0 1px 2px rgba(20,40,58,.05), 0 8px 24px -12px rgba(20,40,58,.12)" },
      transitionTimingFunction: { calm: "cubic-bezier(.22,.61,.36,1)" },
      keyframes: { settle: { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "none" } } },
      animation: { settle: "settle .35s var(--ease-calm, ease) both" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
