import js from "@eslint/js";
import pkg from "globals";
import { defineConfig } from "eslint/config";

const { node, jest } = pkg;

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: node, // Node.js globals
    },
  },
  {
    files: ["**/*.test.js", "**/test/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: { ...node, ...jest }, // Node + Jest globals
    },
  },
]);
