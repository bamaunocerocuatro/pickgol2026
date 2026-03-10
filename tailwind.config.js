 /** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rojo: '#E8192C',
        navy: '#0A1F5C',
        dorado: '#C9A84C',
        verde: '#00C853',
        dark: '#060D1F',
        card: '#0D1B3E',
        gris: '#8892A4',
      },
      fontFamily: {
        barlow: ['Barlow', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
