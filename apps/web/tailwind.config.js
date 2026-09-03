/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2C56F2",
          "blue-dark": "#1B3FC0",
          green: "#25D366",
          ink: "#0B1220",
        },
      },
      fontFamily: {
        display: ["Sora", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
