/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f6fc',
          100: '#e1ecf8',
          200: '#c5ddf2',
          300: '#9ac5e9',
          400: '#67a6dc',
          500: '#4389ce',
          600: '#0f3b68', // Official Indian Govt Deep Navy
          700: '#0b2f54',
          800: '#082543',
          900: '#061c33',
          950: '#041120',
        },
        gov: {
          saffron: '#ff9933',
          saffronDark: '#e67300',
          white: '#ffffff',
          green: '#138808',
          greenDark: '#0e6606',
          navy: '#0b3b60',
          ashoka: '#000080',
          parchment: '#f8fafc',
          gold: '#b45309',
        },
        civic: {
          navy: '#061c33',
          slate: '#334155',
          gold: '#b45309',
          emerald: '#15803d',
          amber: '#d97706',
          crimson: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
