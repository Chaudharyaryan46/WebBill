/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zomato: {
          red: "#ed1c24",
          dark: "#1c1c1c",
          gray: "#9c9c9c",
        },
        webbill: {
          burgundy: "#2A73B6", // Maps to Logo's vibrant Blue arrow
          cream: "#F4F7FB", // Clean cool-toned software background
          tan: "#1B83C6", // Maps to logo's cyan sub-slogan accent
          dark: "#142C5D", // Maps to deep navy "WebBill" text
          muted: "#8A9BAE", // Cool toned subtle text gray
          success: "#3A9D49", // Maps to Logo's vibrant Green leaf
          warning: "#F59E0B", // Standard yellow/amber
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
