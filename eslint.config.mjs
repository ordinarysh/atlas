import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "templates/**",
      "release/**",
      "fixtures/**",
      "dist/**",
      "**/node_modules/**",
      "scripts/validate-no-console.js", // Uses console for output
      ".lintstagedrc.mjs",
      "commitlint.config.mjs",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { project: false }, // fast; no type-aware
    },
    rules: {
      "no-console": "error", // Changed from "off" to align with precommit hooks
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", disallowTypeAnnotations: false },
      ],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    // Allow console in scripts and test files
    files: ["scripts/**/*.ts", "scripts/**/*.js", "tests/**/*.ts", "tests/**/*.js"],
    rules: {
      "no-console": "off", // Scripts need console output
    },
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-require-imports": "off", // Allow require in .js files
    },
  },
);
