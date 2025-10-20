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
        quicksand: ["var(--font-quicksand)"],
        kaisei: ["var(--font-kaisei)"],
        script: ["var(--font-script)"],
        jomolhari: ["var(--font-jomolhari)"],
        inter: ["var(--font-inter)"],
        
        "open-sans": ["var(--font-open-sans)"],
        
        "ooh-baby": ["var(--font-ooh-baby)"],
        poppins: ["var(--font-poppins)"],
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