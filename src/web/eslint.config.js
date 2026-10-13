import eslintReact from "@eslint-react/eslint-plugin";
import eslintJs from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "node_modules", "src/routeTree.gen.ts"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      eslintJs.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      // tseslint.configs.strictTypeChecked,
      // optional
      tseslint.configs.stylisticTypeChecked,
      eslintReact.configs["recommended-typescript"],
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
          disallowTypeAnnotations: false,
        },
      ],
    },
  },
]);
