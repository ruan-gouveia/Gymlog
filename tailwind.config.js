/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/ui/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],

  theme: {
    extend: {
      colors: {
        fundo: "#12132A",
        card: "#1C1D3A",
        borda: "#3A3B6B",
        primaria: "#6C7CFF",
        texto: "#F2F3FF",
        muted: "#8A8DB5",
        perigo: "#FF6B6B",
      },
    },
  },
};
