import { type Config } from "tailwindcss";


export default {
  content: ["./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          strong: "#FF6A00", // Keep existing
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        page: {
          bg: "#FFFCF6", // Keep existing
        },
        text: {
          primary: "#202C3B", // Keep existing
          dark: "#242424", // Keep existing
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        quicksand: ["Quicksand", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        "open-sans": ["Open Sans", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        script: ["Poppins", "cursive"],
        "moon-dance": ["Moon Dance", "cursive"],
        "kaisei-decol": ["Kaisei Decol", "serif"],
        "playpen-sans": ["Playpen Sans", "cursive"],
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
        'slide-in-left-delay-500': 'slideInLeft 1s ease-out 0.5s forwards',
        'slide-in-bottom': 'slideInBottom 0.8s ease-out forwards',
        'slide-in-right': 'slideInRight 1s ease-out forwards',
        'slide-in-right-delay-200': 'slideInRight 1s ease-out 0.2s forwards',
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
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(100px)',
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