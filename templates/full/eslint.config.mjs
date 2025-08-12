// @ts-check
import js from "@eslint/js";
// Use the /flat export for better config inspector experience
import eslintConfigPrettier from "eslint-config-prettier/flat";
import tseslint from "typescript-eslint";
import eslintConfig from "./packages/configs/eslint/base.js";

export default tseslint.config(
  // Global ignores must come first
  {
    name: "@repo/root/ignores",
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/dist-analysis/**",
      "**/dist-analysis-all/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.min.js",
      "**/build/**",
      "**/.cache/**",
      "**/*.config.*",
      "**/next-env.d.ts",
      "**/.env*",
      "**/public/**",
      "**/storybook-static/**",
      "**/.pnpm-store/**",
      "**/.tsbuildinfo",
      "**/out/**",
      "**/*.json",
      "**/*.jsonc",
      "pnpm-lock.yaml",
    ],
  },

  // ESLint v9.33+ recommended baseline with enhanced compatibility
  js.configs.recommended,

  // Linter options for strict error reporting (ESLint v9+ best practices)
  {
    name: "@repo/root/linter-options",
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error", // New in ESLint v9 - already present ✅
    },
  },

  // Use the imported configurations properly
  ...eslintConfig.configs.professional,

  // Override TypeScript parser options for monorepo structure
  {
    name: "@repo/root/typescript-parser-options",
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Override for package source files with additional rules
  {
    name: "@repo/root/packages-source-overrides",
    files: ["packages/*/src/**/*.{ts,tsx}"],
    rules: {
      // Disable all import sorting - handled by Prettier
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-exports": "off",
      "perfectionist/sort-named-exports": "off",

      // Additional strictness for library code
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",

      // TypeScript ESLint v8 enhanced rules for libraries
      "@typescript-eslint/no-empty-object-type": "error", // New in v8
      "@typescript-eslint/no-unsafe-function-type": "error", // New in v8
      "@typescript-eslint/no-wrapper-object-types": "error", // New in v8
      "@typescript-eslint/no-require-imports": "error", // New in v8
      "@typescript-eslint/no-unnecessary-type-parameters": "error", // New in v8
      "@typescript-eslint/prefer-namespace-keyword": "error", // New in v8
      "@typescript-eslint/no-unused-expressions": "error", // New in v8
      "@typescript-eslint/only-throw-error": "error", // New in v8 - ensure only Error objects are thrown
      "@typescript-eslint/no-array-delete": "error", // New in v8 - prevent array delete
      "@typescript-eslint/no-unsafe-unary-minus": "error", // New in v8
    },
  },

  // Configuration files specific rules
  {
    name: "@repo/eslint-config/config-files",
    files: [
      "eslint.config.*",
      "vite.config.*",
      "tailwind.config.*",
      "postcss.config.*",
      "next.config.*",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // Test files configuration - keep type safety!
  {
    name: "@repo/eslint-config/test-files",
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Only relax rules that make sense for tests
      "@typescript-eslint/no-non-null-assertion": "warn", // Sometimes needed in tests
      // Keep all other type checking active!
    },
  },

  // Next.js specific configuration
  {
    name: "@repo/eslint-config/nextjs-overrides",
    files: ["apps/scope/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_|^React$",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Next.js 13+ app router specific
      "@typescript-eslint/prefer-nullish-coalescing": ["error", { ignoreConditionalTests: true }],
    },
  },

  // Performance-optimized import/extension rules for monorepo
  {
    name: "@repo/eslint-config/performance-imports",
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    rules: {
      // Fast alternative to import/extensions (no disk lookups)
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration > Literal[value=/\\.tsx?$/]",
          message: "Unexpected use of file extension (.ts/.tsx) in import",
        },
        {
          selector: "ImportExpression > Literal[value=/\\.tsx?$/]",
          message: "Unexpected use of file extension (.ts/.tsx) in import",
        },
        {
          selector: "TSImportType > TSLiteralType > Literal[value=/\\.tsx?$/]",
          message: "Unexpected use of file extension (.ts/.tsx) in import",
        },
        {
          selector: 'CallExpression[callee.name="require"] > Literal[value=/\\.tsx?$/]',
          message: "Unexpected use of file extension (.ts/.tsx) in require",
        },
      ],
    },
  },

  // Prettier compatibility - MUST be last to override any conflicting rules
  {
    name: "@repo/eslint-config/prettier-compatibility",
    ...eslintConfigPrettier,
    rules: {
      // Ensure ESLint focuses only on code quality, not formatting
      ...eslintConfigPrettier.rules,
    },
  },
);
