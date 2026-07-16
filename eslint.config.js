import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["dist/**", "node_modules/**", "docs/**"],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.{js,jsx}", "api/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Existing data-loading effects intentionally update local state. Keep
      // the stable Hooks rules while deferring a broader React Compiler pass.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
];
