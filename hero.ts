import { heroui } from "@heroui/theme";

export default heroui({
  themes: {
    light: {
      colors: {
        // Clean: near-white canvas, white surfaces, brand green as accent only
        background: "#F5F6F5",
        foreground: "#111827",
        content1: "#FFFFFF",
        content2: "#F0F1F0",
        default: {
          50: "#FAFAFA",
          100: "#F4F4F5",
          200: "#E4E4E7",
          300: "#D4D4D8",
          400: "#A1A1AA",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          DEFAULT: "#D4D4D8",
          foreground: "#111827",
        },
        primary: {
          50: "#E8F3EF",
          100: "#C5E2D8",
          200: "#9FCEC0",
          300: "#79BAA8",
          400: "#53A690",
          500: "#1B5E4B",
          600: "#185443",
          700: "#144A3B",
          800: "#104033",
          900: "#0C362B",
          DEFAULT: "#1B5E4B",
          foreground: "#FFFFFF",
        },
        secondary: {
          50: "#FBF6E8",
          100: "#F5E9C5",
          200: "#EDDA9E",
          300: "#E5CB77",
          400: "#DDBC50",
          500: "#C9A227",
          600: "#B39223",
          700: "#9C821F",
          800: "#85721B",
          900: "#6E6217",
          DEFAULT: "#C9A227",
          foreground: "#1B5E4B",
        },
      },
    },
  },
});
