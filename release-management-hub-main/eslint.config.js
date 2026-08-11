import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Matches production's eslint.config.js: unused vars are an error,
      // except names starting with an uppercase letter or underscore.
      // Also sets argsIgnorePattern, which production's config doesn't -
      // varsIgnorePattern alone doesn't cover a destructured function
      // parameter (e.g. `.map(([key, Icon]) => <Icon/>)`), since espree
      // doesn't treat a JSXIdentifier tag-name as a reference to the
      // parameter binding it resolves to, so plain no-unused-vars sees it
      // as an unused *argument*, not an unused *variable*.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]", argsIgnorePattern: "^[A-Z_]" }],
    },
  },
];
