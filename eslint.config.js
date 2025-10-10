import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import globals from "globals";
import vitest from "@vitest/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "./src/generated"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.vitest,
      },
      ecmaVersion: "latest",
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  eslintConfigPrettier,
  {
    files: ["**/*.test.{ts,tsx}"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.all.rules,
      "@typescript-eslint/unbound-method": "off",
      "vitest/require-hook": ["error", { allowedFunctionCalls: ["app.use"] }],
      "vitest/no-conditional-in-test": "off",
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
]);
