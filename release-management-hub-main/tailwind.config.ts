import type { Config } from "tailwindcss";

/* ---------------------------------------------------------------------------
   The single source of design tokens for this app.

   These values were previously CSS custom properties in src/styles/zerra.css
   (--brand, --n-*, --purple-*, --elev*, ...). That stylesheet is gone; the
   values live here so every colour, shadow and radius is reachable as a
   Tailwind utility and nothing is defined twice.

   Palette origin: the production Tailwind theme in
   zm-manage-new-setting-development/tailwind.config.js. Production names the
   brand blue `blue.500`, and this scale keeps that step, so `blue-500` here
   IS production's brand blue.

   Steps not listed below (e.g. green-500) fall through to Tailwind's own
   defaults - prefer the steps defined here, which are the real tokens.
   --------------------------------------------------------------------------- */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Brand aliases. Top bar and general brand are blue.500; the primary
           button is blue.600, exactly as production's Button does it. */
        brand: {
          DEFAULT: "#0D59A3",
          hover: "#0C5194",
          soft: "#E7EEF6",
          softhover: "#B4CCE2",
          border: "#90B3D5",
          text: "#07315A",
        },
        blue: {
          50: "#E7EEF6", 100: "#B4CCE2", 200: "#90B3D5", 300: "#5D90C1", 400: "#3D7AB5",
          500: "#0D59A3", 600: "#0C5194", 700: "#093F74", 800: "#07315A", 900: "#052544",
        },
        /* Neutrals. Named `ink` rather than `gray`/`neutral` so they can't
           silently blend with Tailwind's own scales of those names. */
        ink: {
          0: "#FFFFFF", 25: "#FAFAFA", 50: "#F4F4F5", 100: "#F1F1F1", 150: "#E4E4E7",
          200: "#DADADA", 300: "#BABABA", 400: "#A1A1AA", 500: "#999999", 600: "#6B6B6B",
          700: "#4E4E4E", 800: "#27272A", 900: "#222222",
        },
        green: { 50: "#EBF4EC", 200: "#A3CBA5", 600: "#388E3C", 700: "#1F4E21" },
        red: { 50: "#FCEBEB", 200: "#F1A4A4", 600: "#CC3535", 700: "#7B2020" },
        amber: { 50: "#FBF6E8", 200: "#EDD793", 500: "#D8A715", 700: "#99770F" },
        /* Release news. Production defines purple.1000/1100/1200 only; the
           border and hover steps are derived from those three. */
        purple: { 50: "#FCEBFF", 200: "#EDC7F4", 500: "#BC3AD2", 600: "#A32EB8", 900: "#3A0143" },
      },
      fontFamily: {
        sans: ["'Source Sans 3'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* Steps this design uses that aren't in Tailwind's defaults. */
        "2xs": ["11px", "14px"],
        "13": ["13px", "18px"],
        "15": ["15px", "20px"],
        "22": ["22px", "28px"],
        "26": ["26px", "32px"],
        "32": ["32px", "1.15"],
      },
      spacing: {
        /* Named for what they measure in the shell, so the several places that
           have to agree on these can't drift apart. */
        topbar: "56px",
        annbar: "48px",
        rail: "72px",
        "rail-open": "220px",
        kb: "340px",
        "shell-top": "104px", // topbar + annbar
      },
      boxShadow: {
        elev1: "0 2px 10px rgba(0,0,0,.03), 0 0 20px rgba(0,0,0,.03)",
        elev2: "0 4px 8px rgba(75,97,119,.1)",
        elev3: "0 10px 24px rgba(15,23,42,.12)",
        /* The What's New floater has to read as lifted off the page, so it
           carries a deeper shadow than any card plus a hairline light ring. */
        floater:
          "0 24px 48px -12px rgba(16,24,40,.30), 0 8px 16px -6px rgba(16,24,40,.14), 0 0 0 1px rgba(255,255,255,.9)",
        rail: "0 4px 6px -1px rgba(0,0,0,.1)",
      },
      zIndex: {
        banner: "60",
        rail: "70",
        kb: "75",
        topbar: "100",
        floater: "110",
        rowmenu: "115",
        modal: "120",
        spotlight: "130",
      },
      maxWidth: {
        prose: "80ch",
        lede: "70ch",
        cell: "46ch",
        empty: "44ch",
      },
      keyframes: {
        /* Unseen release news: the button carries a ring pulse until the
           reader opens the panel once, then settles to the quiet state. */
        "wn-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,.55)" },
          "60%": { boxShadow: "0 0 0 8px rgba(255,255,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
        },
        "wn-nudge": {
          "0%, 72%, 100%": { transform: "none" },
          "80%": { transform: "rotate(-12deg)" },
          "88%": { transform: "rotate(10deg)" },
        },
        "wn-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "none" },
        },
        "spot-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "wn-pulse": "wn-pulse 2.4s ease-out infinite",
        "wn-nudge": "wn-nudge 2.4s ease-out infinite",
        "wn-in": "wn-in .18s ease-out",
        "spot-in": "spot-in .25s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
