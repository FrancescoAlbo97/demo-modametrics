/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f4dbb0',
          300: '#ecc07d',
          400: '#e3a047',
          500: '#d4842a',
          600: '#b86820',
          700: '#964f1d',
          800: '#7a401f',
          900: '#65351c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
