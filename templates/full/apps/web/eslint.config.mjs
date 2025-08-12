// @ts-check
import eslintConfig from '@atlas/config-eslint/base.js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // Ignore patterns first
  {
    name: 'app/web/ignores',
    ignores: [
      '.next/**',
      'node_modules/**',
      'public/**',
      '*.config.*',
      'next-env.d.ts',
      '.env*',
      'coverage/**',
      'storybook-static/**',
    ],
  },

  // Extend the shared Next.js configuration
  ...eslintConfig.configs.nextjs,

  // App-specific overrides for source files
  {
    name: 'app/web/overrides',
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2024,
      },
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // App-specific rule overrides if needed
      '@typescript-eslint/no-explicit-any': 'warn', // Allow during development
    },
  },

  // React Hooks enforcement
  {
    name: 'app/web/react-hooks',
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },

  // Test files configuration
  {
    name: 'app/web/test-files',
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      '**/__mocks__/**/*.{ts,tsx,js,jsx}',
      '**/*.stories.{ts,tsx,js,jsx}',
    ],
    rules: {
      // Relaxed rules for testing
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // Configuration files - relaxed rules
  {
    name: 'app/web/config-files',
    files: [
      'next.config.*',
      'tailwind.config.*',
      'postcss.config.*',
      '*.config.*',
    ],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // Prettier compatibility - MUST be last to override any conflicting rules
  {
    name: 'app/web/prettier-compatibility',
    ...eslintConfigPrettier,
  }
)
