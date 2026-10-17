/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        fundo: "#11122B",
        card: "#1B1D3A",
        borda: "#2E3160",
        primaria: "#5C7CFA",
        texto: "#F3F4FF",
        muted: "#A3A6CC",
        perigo: "#F2677A",
      },
    },
  },
  plugins: [],
};
