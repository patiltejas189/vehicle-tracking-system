export default {
  plugins: {
    '@tailwindcss/postcss': {
      content: ["./src/**/*.{html,js,jsx,ts,tsx}"],
    },
    autoprefixer: {},
  },
}