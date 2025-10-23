import { type Config } from "tailwindcss";


export default {
  theme: {
    extend: {
      colors: {
        page: {
          bg: "#FFFCF6",
        },
        text: {
          primary: "#202C3B",
          dark: "#242424",
        },
        accent: {
          DEFAULT: "#BE8C53",
          strong: "#FF6A00",
        },
      },
      fontFamily: {
        quicksand: ["var(--font-quicksand)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        "open-sans": ["var(--font-open-sans)", "sans-serif"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          lg: "2rem",
          xl: "3rem",
        },
        screens: {
          "2xl": "1512px",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;