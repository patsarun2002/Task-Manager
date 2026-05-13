import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    ...js.configs.recommended,
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];