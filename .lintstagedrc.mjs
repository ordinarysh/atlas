export default {
  // Authoritative ignore - lint-staged will respect this
  ignore: ["templates/**"],

  // TypeScript files
  "**/*.{ts,tsx}": [
    "eslint --fix --max-warnings 0",
    () => "tsc --project tsconfig.json --noEmit --pretty false",
  ],

  // JavaScript/MJS/CJS files (exclude config files that ESLint ignores)
  "**/*.{js,jsx,cjs}": ["eslint --fix --max-warnings 0"],

  // JSON files
  "**/*.json": ["prettier --write"],

  // YAML files
  "**/*.{yml,yaml}": ["prettier --write"],

  // Markdown files
  "**/*.md": ["prettier --write"],

  // Schema validation for manifests (non-template files only)
  "addons/**/steps.json": "pnpm validate --changed || pnpm validate",
  "migrations/**/plan.json": "pnpm validate --changed || pnpm validate",
};
