/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // This makes 'Roboto' the default font for the 'sans' class
        sans: ['Roboto', 'sans-serif'],
      },
      colors: {
        mainColor: "var(--color-main)",
        secoundColor: "var(--color-second)",
        thirdColor: "var(--color-third)",
        fourthColor: "#5E5E5E",
        whiteColor: "#ffffff",
      },
      backgroundColor: {
        mainBgColor: "#E5E5E5",
        secoundBgColor: "#F5F5F5",
        thirdBgColor: "#F4F4F4",
        AddButton: "#ffffff",
      },
      screens: {
        sm: "320px", // Small devices (e.g., phones)
        md: "640px", // Medium devices (e.g., tablets)
        lg: "740px", // Large devices (small laptops)
        xl: "1280px", // Extra large devices (desktops)
        "2xl": "1536px", // Double extra large devices (larger desktops)
      },
    },
  },
  plugins: [],
};
