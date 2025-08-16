// @ts-check
import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import promise from 'eslint-plugin-promise'
import react from 'eslint-plugin-react'
import security from 'eslint-plugin-security'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

/**
 * Professional ESLint configuration plugin for TypeScript monorepos.
 * Balanced quality enforcement focused on bug prevention and meaningful improvements.
 * Follows ESLint v9.33+ flat config and typescript-eslint v8.39+ professional standards.
 *
 * SEPARATION OF CONCERNS:
 * - ESLint: Code quality, logic errors, best practices
 * - Prettier: Code formatting (handled via eslint-config-prettier)
 * - TypeScript: Type checking and type safety
 *
 * OPTIMIZATIONS FOR MVP DEVELOPMENT:
 * - TypeScript ESLint v8 enhanced rules for type safety without pedantry
 * - projectService configuration for optimal performance
 * - Prettier compatibility via eslint-config-prettier
 * - Practical rules for rapid MVP development without sacrificing quality
 *
 * @see https://eslint.org/docs/latest/extend/plugins
 * @see https://typescript-eslint.io/packages/typescript-eslint
 * @see https://github.com/prettier/eslint-config-prettier
 */
const plugin = {
  meta: {
    name: '@repo/eslint-config',
    version: '2.1.0',
  },
  configs: {},
  rules: {},
  processors: {},
}

// Type-aware rules that require TypeScript type information
const typeAwareRules = {
  // Bug prevention with type information
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/no-unnecessary-condition': 'error',
  '@typescript-eslint/return-await': ['error', 'in-try-catch'], // Better async error handling

  // TypeScript ESLint v8 type-aware rules
  '@typescript-eslint/only-throw-error': 'error', // New in v8
  '@typescript-eslint/prefer-find': 'error', // New in v8
  '@typescript-eslint/prefer-regexp-exec': 'error', // New in v8
  '@typescript-eslint/no-unnecessary-type-parameters': 'error', // New in v8
  '@typescript-eslint/no-unsafe-unary-minus': 'error', // New in v8

  // Unsafe operations detection
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
}

// Professional rule sets for non-type-aware rules (no type checking required)
const professionalBaseRules = {
  // Enhanced unused variables detection
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      destructuredArrayIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
      ignoreRestSiblings: true,
    },
  ],

  // Type safety - practical balance
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
  ],
  '@typescript-eslint/consistent-type-exports': 'error',
  '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
  '@typescript-eslint/prefer-ts-expect-error': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': [
    'error',
    { ignoreConditionalTests: true }, // More flexible for conditionals
  ],
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/prefer-for-of': 'error',
  '@typescript-eslint/prefer-includes': 'error',
  '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  // Type-aware rules - only enable in type-checked configs
  // '@typescript-eslint/no-unnecessary-type-assertion': 'error', // Requires type checking
  // '@typescript-eslint/no-unnecessary-condition': 'error', // Requires type checking

  // TypeScript ESLint v8 enhanced rules (non-type-aware)
  '@typescript-eslint/no-array-delete': 'error', // New in v8
  '@typescript-eslint/no-empty-object-type': 'error', // New in v8, replaces ban-types
  '@typescript-eslint/no-unsafe-function-type': 'error', // New in v8
  '@typescript-eslint/no-wrapper-object-types': 'error', // New in v8
  // Core JavaScript rules that TypeScript extends
  'prefer-promise-reject-errors': 'error', // Enhanced in v8
  'no-return-await': 'off', // Handled by TypeScript rules in type-checked configs

  // Removed overly strict rules:
  // - prefer-readonly: Often impractical in practice
  // - strict-boolean-expressions: Too pedantic
  // - no-confusing-void-expression: High false positive rate
  // - prefer-reduce-type-parameter: Not worth the complexity
  // - naming-convention: Too restrictive for rapid development

  // Disable base rules handled by TypeScript
  'no-unused-vars': 'off',
  'no-undef': 'off',
  'no-redeclare': 'off',
  'no-use-before-define': 'off',
}

const professionalUnicornRules = {
  // Disable overly pedantic rules for MVP development
  'unicorn/prevent-abbreviations': 'off', // props, ref, etc are standard
  'unicorn/filename-case': 'off', // Let devs choose file naming

  // Code quality enforcement - keep valuable rules
  'unicorn/better-regex': 'error',
  'unicorn/catch-error-name': 'error',
  'unicorn/consistent-destructuring': 'error',
  'unicorn/custom-error-definition': 'error',
  'unicorn/error-message': 'error',
  'unicorn/escape-case': 'error',
  'unicorn/expiring-todo-comments': 'error',
  'unicorn/explicit-length-check': 'error',
  'unicorn/new-for-builtins': 'error',
  'unicorn/no-abusive-eslint-disable': 'error',
  'unicorn/no-array-push-push': 'error',
  'unicorn/no-console-spaces': 'error',
  'unicorn/no-hex-escape': 'error',
  'unicorn/no-instanceof-array': 'error',
  'unicorn/no-lonely-if': 'error',
  'unicorn/no-new-array': 'error',
  'unicorn/no-new-buffer': 'error',
  'unicorn/no-object-as-default-parameter': 'error',
  'unicorn/no-process-exit': 'error',
  'unicorn/no-static-only-class': 'error',
  'unicorn/no-thenable': 'error',
  'unicorn/no-this-assignment': 'error',
  'unicorn/no-unnecessary-await': 'error',
  'unicorn/no-unreadable-array-destructuring': 'error',
  'unicorn/no-unreadable-iife': 'error',
  'unicorn/no-useless-length-check': 'error',
  'unicorn/no-useless-promise-resolve-reject': 'error',
  'unicorn/no-useless-spread': 'error',
  'unicorn/no-zero-fractions': 'error',
  'unicorn/number-literal-case': 'error',
  'unicorn/numeric-separators-style': 'error',

  // Modern API preferences - genuinely helpful
  'unicorn/prefer-add-event-listener': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-array-flat': 'error',
  'unicorn/prefer-array-flat-map': 'error',
  'unicorn/prefer-array-index-of': 'error',
  'unicorn/prefer-array-some': 'error',
  'unicorn/prefer-at': 'error',
  'unicorn/prefer-code-point': 'error',
  'unicorn/prefer-date-now': 'error',
  'unicorn/prefer-default-parameters': 'error',
  'unicorn/prefer-includes': 'error',
  'unicorn/prefer-math-trunc': 'error',
  'unicorn/prefer-modern-dom-apis': 'error',
  'unicorn/prefer-modern-math-apis': 'error',
  'unicorn/prefer-native-coercion-functions': 'error',
  'unicorn/prefer-negative-index': 'error',
  'unicorn/prefer-node-protocol': 'error',
  'unicorn/prefer-number-properties': 'error',
  'unicorn/prefer-object-from-entries': 'error',
  'unicorn/prefer-optional-catch-binding': 'error',
  'unicorn/prefer-prototype-methods': 'error',
  'unicorn/prefer-query-selector': 'error',
  'unicorn/prefer-reflect-apply': 'error',
  'unicorn/prefer-regexp-test': 'error',
  'unicorn/prefer-set-has': 'error',
  'unicorn/prefer-string-replace-all': 'error',
  'unicorn/prefer-string-slice': 'error',
  'unicorn/prefer-string-starts-ends-with': 'error',
  'unicorn/prefer-string-trim-start-end': 'error',
  'unicorn/prefer-switch': 'error',
  'unicorn/prefer-type-error': 'error',

  // Keep sensible defaults
  'unicorn/relative-url-style': 'error',
  'unicorn/require-array-join-separator': 'error',
  'unicorn/require-number-to-fixed-digits-argument': 'error',
  'unicorn/require-post-message-target-origin': 'error',
  'unicorn/string-content': 'error',
  'unicorn/switch-case-braces': 'error',
  'unicorn/text-encoding-identifier-case': 'error',
  'unicorn/throw-new-error': 'error',

  // REMOVED DOGMATIC RULES:
  // - no-array-for-each: forEach is perfectly fine
  // - no-for-loop: for loops are valid and sometimes clearer
  // - no-null: null has legitimate uses
  // - no-nested-ternary: Sometimes nested ternary is clearest
  // - no-negated-condition: Sometimes !condition is clearer
  // - consistent-function-scoping: Often creates unnecessary complexity
  // - no-array-callback-reference: Often creates unnecessary verbosity
  // - prefer-logical-operator-over-ternary: Ternary can be clearer
  // - prefer-ternary: Sometimes if/else is clearer
}

const professionalPerfectionistRules = {
  // Import organization - DISABLED to avoid conflicts with Prettier plugin
  // Prettier's @ianvs/prettier-plugin-sort-imports handles this better
  'perfectionist/sort-imports': 'off',
  'perfectionist/sort-named-imports': 'off',
  'perfectionist/sort-exports': 'off',
  'perfectionist/sort-named-exports': 'off',

  // Object/type sorting also disabled for consistency
  'perfectionist/sort-object-types': 'off',
  'perfectionist/sort-interfaces': 'off',
  'perfectionist/sort-objects': 'off',
  'perfectionist/sort-union-types': 'off',

  // REMOVED MICRO-MANAGEMENT RULES:
  // - sort-* rules: Prettier handles formatting and sorting
  // - Logical grouping > alphabetical for readability
}

const professionalSecurityRules = {
  // Security enforcement - focus on real threats
  'security/detect-buffer-noassert': 'error',
  'security/detect-child-process': 'error',
  'security/detect-disable-mustache-escape': 'error',
  'security/detect-eval-with-expression': 'error',
  'security/detect-new-buffer': 'error',
  'security/detect-no-csrf-before-method-override': 'error',
  'security/detect-non-literal-require': 'error',
  'security/detect-pseudoRandomBytes': 'error',
  'security/detect-unsafe-regex': 'error', // Keep - genuine security risk

  // REMOVED HIGH FALSE POSITIVE RULES:
  // - detect-object-injection: Very high false positive rate
  // - detect-non-literal-fs-filename: Not relevant for most web apps
  // - detect-non-literal-regexp: Often legitimate dynamic regex
  // - detect-possible-timing-attacks: Rarely relevant for typical apps
}

const professionalPromiseRules = {
  // Promise handling - keep these as they prevent real bugs
  'promise/always-return': 'error',
  'promise/catch-or-return': 'error',
  'promise/no-callback-in-promise': 'error',
  'promise/no-multiple-resolved': 'error',
  'promise/no-nesting': 'error',
  'promise/no-new-statics': 'error',
  'promise/no-promise-in-callback': 'error',
  'promise/no-return-in-finally': 'error',
  'promise/no-return-wrap': 'error',
  'promise/param-names': 'error',
  'promise/prefer-await-to-callbacks': 'error',
  'promise/prefer-await-to-then': 'error',
  'promise/valid-params': 'error',
}

const professionalSonarRules = {
  // Code complexity and cognitive load - realistic limits
  'sonarjs/cognitive-complexity': ['error', 25], // More realistic limit
  'sonarjs/max-switch-cases': ['error', 50], // More practical limit

  // Bug prevention - keep these
  'sonarjs/no-all-duplicated-branches': 'error',
  'sonarjs/no-collection-size-mischeck': 'error',
  'sonarjs/no-duplicated-branches': 'error',
  'sonarjs/no-element-overwrite': 'error',
  'sonarjs/no-empty-collection': 'error',
  'sonarjs/no-extra-arguments': 'error',
  'sonarjs/no-gratuitous-expressions': 'error',
  'sonarjs/no-identical-conditions': 'error',
  'sonarjs/no-ignored-return': 'error',
  'sonarjs/no-one-iteration-loop': 'error',
  'sonarjs/no-redundant-boolean': 'error',
  'sonarjs/no-redundant-jump': 'error',
  'sonarjs/no-same-line-conditional': 'error',
  'sonarjs/no-unused-collection': 'error',
  'sonarjs/no-use-of-empty-return-value': 'error',
  'sonarjs/no-useless-catch': 'error',

  // Helpful suggestions
  'sonarjs/prefer-object-literal': 'error',
  'sonarjs/prefer-single-boolean-return': 'error',
  'sonarjs/prefer-while': 'error',

  // REMOVED OVERLY STRICT/OPINIONATED RULES:
  // - no-duplicate-string: Forces premature optimization
  // - no-identical-expressions: Sometimes repetition is clearer
  // - no-collapsible-if: Sometimes separate ifs are clearer
  // - no-inverted-boolean-check: Sometimes !condition is clearer
  // - no-nested-switch: Can be legitimate
  // - no-nested-template-literals: Can be clearer than concatenation
  // - no-small-switch: Small switches can be appropriate
  // - prefer-immediate-return: Sometimes intermediate variables add clarity
}

const professionalReactRules = {
  // Bug prevention and security - keep these
  'react/button-has-type': 'error',
  'react/display-name': 'error',
  'react/hook-use-state': 'error',
  'react/iframe-missing-sandbox': 'error',
  'react/jsx-key': ['error', { checkFragmentShorthand: true }],
  'react/jsx-no-comment-textnodes': 'error',
  'react/jsx-no-constructed-context-values': 'error',
  'react/jsx-no-duplicate-props': 'error',
  'react/jsx-no-leaked-render': 'error',
  'react/jsx-no-script-url': 'error',
  'react/jsx-no-target-blank': 'error',
  'react/jsx-no-undef': 'error',
  'react/jsx-no-useless-fragment': 'error',
  'react/jsx-pascal-case': 'error',
  'react/jsx-uses-react': 'off', // React 17+
  'react/jsx-uses-vars': 'error',

  // Component quality - helpful rules
  'react/no-array-index-key': 'error',
  'react/no-children-prop': 'error',
  'react/no-danger': 'error',
  'react/no-danger-with-children': 'error',
  'react/no-deprecated': 'error',
  'react/no-direct-mutation-state': 'error',
  'react/no-find-dom-node': 'error',
  'react/no-is-mounted': 'error',
  'react/no-render-return-value': 'error',
  'react/no-string-refs': 'error',
  'react/no-this-in-sfc': 'error',
  'react/no-typos': 'error',
  'react/no-unescaped-entities': 'error',
  'react/no-unknown-property': 'error',
  'react/no-unsafe': 'error',
  'react/require-render-return': 'error',
  'react/self-closing-comp': 'off', // Formatting - handled by Prettier
  'react/style-prop-object': 'error',
  'react/void-dom-elements-no-children': 'error',

  // TypeScript-friendly settings
  'react/prop-types': 'off', // Using TypeScript
  'react/react-in-jsx-scope': 'off', // React 17+
  'react/require-default-props': 'off', // Using TypeScript

  // REMOVED OVERLY STYLISTIC/DOGMATIC RULES:
  // - All jsx-indent, jsx-spacing, jsx-curly rules: Pure formatting
  // - jsx-sort-props: Alphabetical > logical grouping is wrong
  // - jsx-sort-default-props: Same issue
  // - jsx-max-depth: Can be overly restrictive
  // - jsx-max-props-per-line: Stylistic preference
  // - jsx-no-bind: Too strict, inline functions are often fine
  // - jsx-handler-names: Naming convention overreach
  // - jsx-first-prop-new-line: Pure formatting
  // - jsx-wrap-multilines: Pure formatting
  // - boolean-prop-naming: Naming convention overreach
  // - destructuring-assignment: Style preference
  // - forbid-prop-types: Too restrictive with TypeScript
  // - no-multi-comp: Sometimes multiple components per file makes sense
  // - prefer-stateless-function: Components vs functions is developer choice
  // - sort-comp: Method ordering should be logical, not alphabetical
  // - state-in-constructor: Implementation detail
  // - And many other purely stylistic rules...
}

// Assign configs using the modern approach for self-referencing
Object.assign(plugin.configs, {
  /**
   * Professional configuration with balanced quality enforcement.
   * Focused on bug prevention and meaningful improvements with full type-checking.
   */
  professional: tseslint.config(
    {
      name: '@repo/eslint-config/professional-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/professional-typescript-strict',
      files: ['**/*.{ts,tsx,mts,cts}'],
      extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        unicorn,
        perfectionist,
        security,
        promise,
        sonarjs,
      },
      languageOptions: {
        parserOptions: {
          // Modern TypeScript ESLint v8 projectService configuration
          // Using projectService for better performance and compatibility
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        ...professionalBaseRules,
        ...professionalUnicornRules,
        ...professionalPerfectionistRules,
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...professionalSonarRules,
        ...typeAwareRules, // Apply type-aware rules
        ...prettierConfig.rules, // Disable all formatting rules

        // Additional enterprise-specific overrides
        '@typescript-eslint/no-explicit-any': 'error', // Zero tolerance
      },
    },
    {
      name: '@repo/eslint-config/professional-js-disable-type-checked',
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
      plugins: {
        unicorn,
        security,
        promise,
        sonarjs,
      },
      rules: {
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...professionalSonarRules,
        // Safe unicorn rules for JS
        'unicorn/better-regex': 'error',
        'unicorn/catch-error-name': 'error',
        'unicorn/consistent-destructuring': 'error',
        'unicorn/error-message': 'error',
        'unicorn/no-abusive-eslint-disable': 'error',
        'unicorn/no-array-for-each': 'error',
        'unicorn/no-console-spaces': 'error',
        'unicorn/no-for-loop': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',
      },
    }
  ),

  /**
   * Base configuration for TypeScript projects.
   * Professional rules without full type-checking for fast development.
   */
  base: tseslint.config(
    {
      name: '@repo/eslint-config/base-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/base-typescript',
      files: ['**/*.{ts,tsx,mts,cts}'],
      extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
      plugins: {
        unicorn,
        perfectionist,
        promise,
      },
      rules: {
        ...professionalBaseRules,
        ...professionalPerfectionistRules,
        ...professionalPromiseRules,
        // Note: Type-aware rules NOT included here as base config doesn't use type checking
      },
    }
  ),

  /**
   * Development configuration optimized for productivity.
   * Balanced rules for active development with helpful warnings.
   */
  development: tseslint.config(
    {
      name: '@repo/eslint-config/development-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/development-typescript',
      files: ['**/*.{ts,tsx,mts,cts}'],
      extends: [
        ...tseslint.configs.recommendedTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        unicorn,
        perfectionist,
        promise,
      },
      languageOptions: {
        parserOptions: {
          projectService: {
            allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
            maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 8,
          },
        },
      },
      rules: {
        ...professionalBaseRules,
        ...professionalPerfectionistRules,
        ...professionalPromiseRules,
        ...typeAwareRules, // Include type-aware rules in development
        ...prettierConfig.rules, // Disable formatting rules

        // Development-friendly overrides
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict for development
      },
    }
  ),

  /**
   * React-specific enterprise configuration.
   * Comprehensive React best practices with accessibility enforcement.
   */
  react: tseslint.config(
    {
      name: '@repo/eslint-config/react-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/react-typescript',
      files: ['**/*.{jsx,tsx}'],
      extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        react,
        'jsx-a11y': jsxA11y,
        unicorn,
        perfectionist,
        security,
        promise,
        sonarjs,
      },
      languageOptions: {
        parserOptions: {
          // Modern TypeScript ESLint v8 projectService configuration
          // Using projectService for better performance and compatibility
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
          ecmaFeatures: {
            jsx: true,
          },
        },
        globals: {
          React: 'readonly',
          JSX: 'readonly',
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        ...professionalBaseRules,
        ...professionalUnicornRules,
        ...professionalPerfectionistRules,
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...professionalSonarRules,
        ...prettierConfig.rules, // Disable all formatting rules
        ...professionalReactRules,

        // React-specific variable handling
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_|^React$',
            destructuredArrayIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],

        // Accessibility rules (enterprise standard)
        'jsx-a11y/accessible-emoji': 'error',
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/autocomplete-valid': 'error',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/control-has-associated-label': 'error',
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/img-redundant-alt': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/label-has-associated-control': 'error',
        'jsx-a11y/media-has-caption': 'error',
        'jsx-a11y/mouse-events-have-key-events': 'error',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/no-autofocus': 'error',
        'jsx-a11y/no-distracting-elements': 'error',
        'jsx-a11y/no-interactive-element-to-noninteractive-role': 'error',
        'jsx-a11y/no-noninteractive-element-interactions': 'error',
        'jsx-a11y/no-noninteractive-element-to-interactive-role': 'error',
        'jsx-a11y/no-noninteractive-tabindex': 'error',
        'jsx-a11y/no-onchange': 'error',
        'jsx-a11y/no-redundant-roles': 'error',
        'jsx-a11y/no-static-element-interactions': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        'jsx-a11y/scope': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',
      },
    }
  ),

  /**
   * Next.js enterprise configuration with React and performance optimizations.
   * Comprehensive Next.js best practices with app router support.
   */
  nextjs: tseslint.config(
    {
      name: '@repo/eslint-config/nextjs-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/nextjs-typescript',
      files: ['**/*.{js,jsx,ts,tsx}'],
      extends: [
        ...tseslint.configs.recommendedTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        react,
        'jsx-a11y': jsxA11y,
        unicorn,
        perfectionist,
        security,
        promise,
      },
      languageOptions: {
        parserOptions: {
          // Use projectService for type-aware linting in Next.js
          projectService: {
            allowDefaultProject: ['*.js', '*.mjs', '*.cjs'],
            maximumDefaultProjectFileMatchCount_THIS_WILL_SLOW_DOWN_LINTING: 8,
          },
          tsconfigRootDir: import.meta.dirname,
          ecmaFeatures: {
            jsx: true,
          },
        },
        globals: {
          React: 'readonly',
          JSX: 'readonly',
          window: 'readonly',
          document: 'readonly',
          console: 'readonly',
          process: 'readonly',
          global: 'readonly',
        },
      },
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        ...professionalBaseRules,
        ...professionalPerfectionistRules,
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...prettierConfig.rules, // Disable formatting rules
        // Note: Type-aware rules not included as Next.js config uses relaxed type checking

        // Next.js optimized variable handling
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_|^React$',
            destructuredArrayIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],

        // Next.js specific type handling
        '@typescript-eslint/prefer-nullish-coalescing': [
          'error',
          {
            ignoreConditionalTests: true,
            ignoreMixedLogicalExpressions: true,
          },
        ],
        '@typescript-eslint/no-explicit-any': 'warn', // Next.js flexibility
        '@typescript-eslint/no-unsafe-assignment': 'off', // Next.js flexibility
        '@typescript-eslint/no-unsafe-call': 'off', // Next.js flexibility
        '@typescript-eslint/no-unsafe-member-access': 'off', // Next.js flexibility
        '@typescript-eslint/no-unsafe-return': 'off', // Next.js flexibility
        '@typescript-eslint/strict-boolean-expressions': 'off', // Next.js patterns

        // Essential React rules for Next.js
        'react/react-in-jsx-scope': 'off', // Next.js 13+
        'react/prop-types': 'off', // Using TypeScript
        'react/jsx-uses-react': 'off', // Next.js 13+
        'react/display-name': 'error',
        'react/jsx-key': ['error', { checkFragmentShorthand: true }],
        'react/jsx-no-target-blank': 'error',
        'react/no-children-prop': 'error',
        'react/no-danger-with-children': 'error',
        'react/no-deprecated': 'error',
        'react/no-find-dom-node': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'error',
        'react/no-unknown-property': 'error',
        'react/self-closing-comp': 'off', // Formatting - handled by Prettier
        'react/void-dom-elements-no-children': 'error',

        // Performance-focused unicorn rules for Next.js
        'unicorn/better-regex': 'error',
        'unicorn/catch-error-name': 'error',
        'unicorn/consistent-destructuring': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',
        'unicorn/prefer-modern-dom-apis': 'error',
        'unicorn/prefer-query-selector': 'error',

        // Essential accessibility for Next.js
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/anchor-has-content': 'error',
        'jsx-a11y/anchor-is-valid': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/heading-has-content': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/img-redundant-alt': 'error',
        'jsx-a11y/interactive-supports-focus': 'error',
        'jsx-a11y/label-has-associated-control': 'error',
        'jsx-a11y/mouse-events-have-key-events': 'error',
        'jsx-a11y/no-access-key': 'error',
        'jsx-a11y/no-autofocus': 'error',
        'jsx-a11y/no-distracting-elements': 'error',
        'jsx-a11y/no-redundant-roles': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',
      },
    }
  ),

  /**
   * Testing configuration with relaxed rules for test environments.
   * Balanced approach allowing test-specific patterns while maintaining quality.
   */
  testing: tseslint.config(
    {
      name: '@repo/eslint-config/testing-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/testing-typescript',
      files: [
        '**/*.test.{ts,tsx,js,jsx}',
        '**/*.spec.{ts,tsx,js,jsx}',
        '**/__tests__/**/*.{ts,tsx,js,jsx}',
        '**/__mocks__/**/*.{ts,tsx,js,jsx}',
        '**/test/**/*.{ts,tsx,js,jsx}',
        '**/tests/**/*.{ts,tsx,js,jsx}',
        '**/*.stories.{ts,tsx,js,jsx}',
      ],
      extends: [...tseslint.configs.recommended, ...tseslint.configs.stylistic],
      plugins: {
        unicorn,
        perfectionist,
      },
      rules: {
        // Basic type safety for tests
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
        ],

        // Relaxed rules for testing
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/prefer-ts-expect-error': 'off',

        // Disable all import sorting - handled by Prettier
        'perfectionist/sort-imports': 'off',
        'perfectionist/sort-named-imports': 'off',
        'perfectionist/sort-exports': 'off',
        'perfectionist/sort-named-exports': 'off',

        // Safe unicorn rules for tests
        'unicorn/better-regex': 'error',
        'unicorn/catch-error-name': 'error',
        'unicorn/error-message': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',

        // Disable base rules
        'no-unused-vars': 'off',
        'no-undef': 'off',
        'no-redeclare': 'off',
      },
    }
  ),

  /**
   * Library configuration for packages and shared components.
   * Strict rules optimized for reusable library code.
   */
  library: tseslint.config(
    {
      name: '@repo/eslint-config/library-meta',
      linterOptions: {
        noInlineConfig: false,
        reportUnusedDisableDirectives: 'error',
      },
    },
    js.configs.recommended,
    {
      name: '@repo/eslint-config/library-typescript',
      files: ['**/*.{ts,tsx,mts,cts}'],
      extends: [
        ...tseslint.configs.strictTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
      ],
      plugins: {
        unicorn,
        perfectionist,
        security,
        promise,
        sonarjs,
      },
      languageOptions: {
        parserOptions: {
          // Modern TypeScript ESLint v8 projectService configuration
          // Using projectService for better performance and compatibility
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        ...professionalBaseRules,
        ...professionalUnicornRules,
        ...professionalPerfectionistRules,
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...professionalSonarRules,
        ...typeAwareRules, // Apply type-aware rules
        ...prettierConfig.rules, // Disable all formatting rules

        // Library-specific strict rules
        '@typescript-eslint/no-explicit-any': 'error', // Zero tolerance in libraries
        '@typescript-eslint/explicit-function-return-type': 'error', // Required for libraries
        '@typescript-eslint/explicit-module-boundary-types': 'error',
        '@typescript-eslint/typedef': [
          'error',
          {
            arrowParameter: false,
            variableDeclaration: false,
            memberVariableDeclaration: true,
            parameter: true,
            propertyDeclaration: true,
          },
        ],

        // Complexity limits for libraries
        'sonarjs/cognitive-complexity': ['error', 10], // Lower threshold
        'sonarjs/max-switch-cases': ['error', 15], // Lower threshold
      },
    },
    {
      name: '@repo/eslint-config/library-js-disable-type-checked',
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
      plugins: {
        unicorn,
        security,
        promise,
        sonarjs,
      },
      rules: {
        ...professionalSecurityRules,
        ...professionalPromiseRules,
        ...professionalSonarRules,

        // Essential unicorn rules for JS libraries
        'unicorn/better-regex': 'error',
        'unicorn/catch-error-name': 'error',
        'unicorn/consistent-destructuring': 'error',
        'unicorn/error-message': 'error',
        'unicorn/explicit-length-check': 'error',
        'unicorn/no-abusive-eslint-disable': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-string-starts-ends-with': 'error',
      },
    }
  ),
})

export default plugin
