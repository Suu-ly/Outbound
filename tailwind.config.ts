import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-general-sans)"],
        display: ["var(--font-clash-display)"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        brand: {
          "50": "#EBF8FE",
          "100": "#D5EFFD",
          "200": "#AFE1FC",
          "300": "#6CC1F2",
          "400": "#39A6EA",
          "500": "#1886D0",
          "600": "#106CAE",
          "700": "#08538C",
          "800": "#093E6D",
          "900": "#0A3057",
        },
      },
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": {
            opacity: "1",
          },
          "20%,50%": {
            opacity: "0",
          },
        },
        activate: {
          to: {
            pointerEvents: "auto",
          },
        },
        expand: {
          from: {
            height: "var(--content-closed)",
          },
          to: {
            height: "var(--content-height)",
          },
        },
        minimise: {
          from: {
            height: "var(--content-height)",
          },
          to: {
            height: "var(--content-closed)",
          },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        activate: "activate 0s 500ms linear forwards",
        expand: "expand 0.3s cubic-bezier(0.8, 0, 0.2, 1)",
        minimise: "minimise 0.3s cubic-bezier(0.8, 0, 0.2, 1)",
      },
      transitionTimingFunction: {
        snap: "cubic-bezier(0.8, 0, 0.2, 1)",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
