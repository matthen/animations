/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },

  plugins: [
    // https://draculatheme.com/tailwind
    require("tailwind-dracula")(),
  ],
};
