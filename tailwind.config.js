/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14110F",
        saffron: "#FF6A00",
        saffronDeep: "#D45300",
        gold: "#FFC14D",
        cream: "#FFF6EE",
        paper: "#F3EBE3",
        cocoa: "#5C514A",
      },
      fontFamily: {
        sans: ["Outfit", "Noto Sans Gujarati", "Segoe UI", "sans-serif"],
        display: ["Fraunces", "Noto Sans Gujarati", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 10px 28px -16px rgba(20, 17, 15, 0.45)",
        lift: "0 18px 40px -20px rgba(20, 17, 15, 0.55)",
      },
    },
  },
  plugins: [],
};
