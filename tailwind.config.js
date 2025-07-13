/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#000",
        fontColor: "#EEEEEE",
        accent1: "#8E1616",
        accent2: "#D84040"
      },
      fontFamily: {
        sans: ['SFPro'],
        bold: ['SFProBold'],
      }
    },
  },
  plugins: [],
};
