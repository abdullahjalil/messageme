/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          msme: {
            sage: '#596854',      // Dark sage green
            olive: '#7F803E',     // Olive green
            gold: '#CC9A52',      // Golden
            brown: '#AD794B',     // Brown
            cream: '#FCE4B4',     // Cream
          }
        }
      },
    },
    plugins: [],
  }