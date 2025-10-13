import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['"Fredoka One"', 'sans-serif'],
      },
      colors: {
        background: "hsl(0 0% 100%)",
        foreground: "hsl(240 10% 3.9%)",
        muted: "hsl(240 4.8% 95.9%)",
        "muted-foreground": "hsl(240 3.8% 46.1%)",
        border: "hsl(240 5.9% 90%)",
        card: "hsl(0 0% 100%)",
        "card-foreground": "hsl(240 10% 3.9%)",
        primary: "hsl(190 90% 40%)",             // aqua/teal
        "primary-foreground": "hsl(0 0% 100%)",  // white text
      },
      borderRadius: {
        lg: "0.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;