import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { reactRefresh } from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

// Module dependency rules (see CLAUDE.md). Imports reach other modules either
// through the "@/" alias or by climbing with "../".
const moduleImport = (modules) => ({
  regex: `^(@/|(\\.\\./)+)(${modules.join("|")})(/|$)`,
  message: "This module must not depend on that layer (see CLAUDE.md).",
});

const featureInternals = {
  regex: "(^@/|/)features/[^/]+/.+",
  message: "Import a feature only through its public API (index.ts).",
};

// Inside a feature, relative imports must stay within that feature: a file
// nested N levels deep may not climb N levels with "../". Everything outside
// the feature is imported through "@/", where the rules above apply.
const MAX_FEATURE_DEPTH = 8;

const leavesFeature = (depth) => ({
  regex: `^(\\.\\./){${depth}}`,
  message:
    'Relative imports must not leave the feature. Use the "@/" alias instead.',
});

const featureFiles = (depth) =>
  `src/features/*/${"*/".repeat(depth - 1)}*.{ts,tsx}`;

const restrictImports = (...patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{js,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ["*.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: restrictImports(featureInternals),
  },
  ...Array.from({ length: MAX_FEATURE_DEPTH }, (_, index) => ({
    files: [featureFiles(index + 1)],
    rules: restrictImports(
      featureInternals,
      moduleImport(["app"]),
      leavesFeature(index + 1),
    ),
  })),
  {
    files: ["src/infrastructure/**/*.{ts,tsx}"],
    rules: restrictImports(moduleImport(["app", "features"])),
  },
  {
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: restrictImports(moduleImport(["app", "features", "infrastructure"])),
  },
  prettier,
]);
