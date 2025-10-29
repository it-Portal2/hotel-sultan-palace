import { type Config } from "tailwindcss";


export default {
  safelist: [
    'animate-slide-in-bottom',
    'animate-slide-in-left',
    'animate-slide-in-left-delay-200',
    'animate-slide-in-left-delay-400',
  ],
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
        quicksand: ["Quicksand", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        script: ["Poppins", "cursive"],
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
      animation: {
        'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
        'slide-in-left-delay-200': 'slideInLeft 0.8s ease-out 0.2s forwards',
        'slide-in-left-delay-400': 'slideInLeft 0.8s ease-out 0.4s forwards',
        'slide-in-bottom': 'slideInBottom 0.8s ease-out forwards',
      },
      keyframes: {
        slideInLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-100px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        slideInBottom: {
          '0%': {
            opacity: '0',
            transform: 'translateY(50px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      opacity: {
        '0': '0',
        '100': '1',
      },
      transform: {
        'translate-x-negative': 'translateX(-100px)',
        'translate-y-positive': 'translateY(50px)',
      },
    },
  },
  plugins: [],
} satisfies Config;