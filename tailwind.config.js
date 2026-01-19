/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fantasy: {
          900: '#1a1b26', // Deep background
          800: '#24283b', // Card background
          700: '#414868', // Border/Hover
          accent: '#ff9e64', // Orange/Gold accent
          text: '#c0caf5', // Main text
          muted: '#565f89', // Muted text
          success: '#9ece6a',
          danger: '#f7768e',
          warning: '#e0af68',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
      }
    },
  },
  plugins: [],
}