/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: "#050608",
          900: "#0b0d12",
          850: "#11141b",
          800: "#171b24",
          700: "#202635",
        },
        neon: {
          blue: "#4e8dff",
          cyan: "#44e3ff",
          purple: "#9b7cff",
          pink: "#ff67d3",
          mint: "#5cf4c0",
        },
      },
      boxShadow: {
        glass: "0 24px 80px rgba(2, 6, 23, 0.45)",
        glow: "0 0 0 1px rgba(78, 141, 255, 0.15), 0 24px 70px rgba(78, 141, 255, 0.18)",
      },
      backgroundImage: {
        "hero-radial": "radial-gradient(circle at top, rgba(155, 124, 255, 0.18), transparent 35%), radial-gradient(circle at 20% 20%, rgba(78, 141, 255, 0.18), transparent 25%), linear-gradient(180deg, rgba(7, 9, 13, 0.96), rgba(5, 6, 8, 1))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "50%": { transform: "translate3d(0, -14px, 0) scale(1.02)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        float: "float 9s ease-in-out infinite",
        shimmer: "shimmer 8s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};