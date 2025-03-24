import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        "biofox-purple": "#6D28D9", // Deep Purple
        "biofox-purple-light": "#C0A6E3", // Light Purple
        "aura-silver": "#D7D7D7",
        "aura-silver-dark": "#BFC0C0",
        "aurora-pink": "#FF8AE2",
        "aurora-violet": "#8B5CF6",
        "aurora-blue": "#67E8F9",
        "dark-gray-1": "#383B44",
        "dark-gray-2": "#2E3035",
      },
      backgroundImage: {
        "aurora-gradient": "linear-gradient(to right, #FF8AE2, #8B5CF6, #67E8F9)",
      },
      boxShadow: {
        "aura": "0 0 15px rgba(192, 166, 227, 0.5)",
      },
      borderRadius: {
        "brand": "8px",
      },
    },
  },
};

export default config; 