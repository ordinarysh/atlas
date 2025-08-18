// @ts-check
/**
 * Centralized Prettier configuration for the monorepo.
 *
 * This configuration provides:
 * - Consistent code formatting across all packages
 * - Import sorting with @ianvs/prettier-plugin-sort-imports
 * - Tailwind CSS class sorting with prettier-plugin-tailwindcss
 * - File-specific formatting rules for different file types
 * - Monorepo-optimized import ordering
 * - Scope-based architecture support
 *
 * USAGE:
 * ```js
 * // prettier.config.js or .prettierrc.js
 * export { default } from '@repo/configs-prettier'
 * ```
 *
 * OR for JSON config:
 * ```json
 * // .prettierrc
 * "@repo/configs-prettier/base.json"
 * ```
 *
 * Compatible with Prettier ^3.6.2
 *
 * @see https://prettier.io/docs/en/configuration.html
 * @see https://github.com/IanVS/prettier-plugin-sort-imports
 * @see https://github.com/tailwindlabs/prettier-plugin-tailwindcss
 * @type {import("prettier").Config}
 */

/** @type {import("prettier").Config} */
const prettierConfig = {
  // Schema for IDE support
  $schema: 'https://json.schemastore.org/prettierrc',

  // Core formatting options
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  printWidth: 80,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',
  quoteProps: 'as-needed',
  proseWrap: 'preserve',
  htmlWhitespaceSensitivity: 'css',
  embeddedLanguageFormatting: 'auto',
  requirePragma: false,
  insertPragma: false,
  singleAttributePerLine: false,
  jsxSingleQuote: false,
  experimentalTernaries: false,

  // Plugin configuration - ORDER MATTERS for compatibility
  plugins: [
    '@ianvs/prettier-plugin-sort-imports',
    'prettier-plugin-tailwindcss',
  ],

  // Import sorting configuration for monorepo with scope-based architecture
  importOrder: [
    '^(react/(.*)$)|^(react$)', // React first
    '^(next/(.*)$)|^(next$)', // Next.js second
    '<THIRD_PARTY_MODULES>', // Third-party modules
    '^@repo/(.*)$', // Monorepo packages
    '^@/components/(.*)$', // Component imports
    '^@/hooks/(.*)$', // Hook imports
    '^@/utils/(.*)$', // Utility imports
    '^@/lib/(.*)$', // Library imports
    '^@/types/(.*)$', // Type imports
    '^@/constants/(.*)$', // Constant imports
    '^@/(.*)$', // Other internal aliases
    '^[./]', // Relative imports
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '5.9.2',

  // Tailwind CSS class sorting configuration
  tailwindFunctions: ['clsx', 'cn', 'cva', 'twMerge', 'tw'],

  // File-specific formatting overrides
  overrides: [
    // TypeScript files
    {
      files: ['*.ts', '*.tsx'],
      options: {
        parser: 'typescript',
      },
    },

    // JavaScript files
    {
      files: ['*.js', '*.jsx'],
      options: {
        parser: 'babel',
      },
    },

    // ES Modules
    {
      files: ['*.mjs'],
      options: {
        parser: 'babel',
      },
    },

    // CommonJS
    {
      files: ['*.cjs'],
      options: {
        parser: 'babel',
      },
    },

    // JSON files - wider printWidth, no trailing commas
    {
      files: '*.json',
      options: {
        tabWidth: 2,
        printWidth: 100,
        parser: 'json',
        trailingComma: 'none',
      },
    },

    // JSON with Comments
    {
      files: '*.jsonc',
      options: {
        tabWidth: 2,
        printWidth: 100,
        parser: 'json5',
        trailingComma: 'none',
      },
    },

    // Package.json - special handling to preserve npm format
    {
      files: 'package.json',
      options: {
        parser: 'json-stringify',
      },
    },

    // TypeScript config files - no trailing commas
    {
      files: ['tsconfig.json', 'tsconfig.*.json'],
      options: {
        parser: 'json',
        trailingComma: 'none',
      },
    },

    // Markdown files - always wrap prose
    {
      files: '*.md',
      options: {
        tabWidth: 2,
        printWidth: 100,
        proseWrap: 'always',
        parser: 'markdown',
      },
    },

    // MDX files
    {
      files: '*.mdx',
      options: {
        tabWidth: 2,
        printWidth: 100,
        proseWrap: 'always',
        parser: 'mdx',
      },
    },

    // YAML files - double quotes for compatibility
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
        singleQuote: false,
        parser: 'yaml',
      },
    },

    // TOML files
    {
      files: '*.toml',
      options: {
        tabWidth: 2,
        parser: 'toml',
      },
    },

    // CSS files - double quotes conventional
    {
      files: '*.css',
      options: {
        singleQuote: false,
        parser: 'css',
      },
    },

    // SCSS files
    {
      files: '*.scss',
      options: {
        singleQuote: false,
        parser: 'scss',
      },
    },

    // Prettier config files
    {
      files: '.prettierrc',
      options: {
        parser: 'json',
      },
    },

    // HTML files - wider printWidth
    {
      files: ['*.html'],
      options: {
        parser: 'html',
        printWidth: 120,
      },
    },

    // SVG files - treat as HTML
    {
      files: ['*.svg'],
      options: {
        parser: 'html',
      },
    },
  ],
}

export default prettierConfig
