/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0B0B0F",
        cream: "#FFF8E7",
        paper: "#FFFFFF",
        spark: "#70E000",
        "spark-dark": "#5CC100",
        violet: "#7C3AED",
        pink: "#FF4D8D",
        orange: "#FF8A00",
        sun: "#FFD60A",
        sky: "#00C2FF",
        blue: "#3B82F6",
        mist: "#E5E7EB",
        danger: "#E11D48",
      },
      fontFamily: {
        display: ["Baloo 2", "Fredoka", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "6px 6px 0 0 #0B0B0F",
        "pop-sm": "4px 4px 0 0 #0B0B0F",
      },
      keyframes: {
        floaty: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } },
        wiggle: { "0%,100%": { transform: "rotate(-3deg)" }, "50%": { transform: "rotate(3deg)" } },
      },
      animation: {
        floaty: "floaty 4s ease-in-out infinite",
        wiggle: "wiggle 0.4s ease-in-out",
      },
    },
  },
  plugins: [],
};
