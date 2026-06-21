import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
  { ignores: ["dist/"] },
  {
    files: ["src/**/*.{ts,js,mjs}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      prettier: prettierPlugin,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "id-length": [
        "warn",
        {
          min: 3,
          exceptions: ["_", "x", "y", "z", "i", "j", "k", "dx", "dy"],
          exceptionPatterns: ["^_[a-z]"],
          properties: "never",
        },
      ],
      "no-console": "warn",
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "prettier/prettier": "error",
    },
  },
);
