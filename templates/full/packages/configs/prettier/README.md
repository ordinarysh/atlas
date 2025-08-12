# @repo/configs-prettier

Centralized Prettier configuration for the monorepo providing consistent code formatting across all packages.

> 🚀 Compatible with Prettier v3.6.2+

## Features

- **Consistent formatting** across TypeScript, JavaScript, JSON, Markdown, CSS, YAML, and more
- **Import sorting** with `@ianvs/prettier-plugin-sort-imports` optimized for monorepo structure
- **Scope-based architecture support** with dedicated import ordering for components, hooks, utils, etc.
- **Tailwind CSS class sorting** with `prettier-plugin-tailwindcss`
- **File-specific rules** for different file types
- **Zero configuration** setup for most use cases
- **TypeScript type annotations** for better IDE support

## Usage

### Method 1: JSON Configuration (Recommended)

Create a `.prettierrc` file in your package root:

```json
"@repo/configs-prettier/base.json"
```

### Method 2: JavaScript Configuration

Create a `prettier.config.js` file in your package root:

```js
export { default } from '@repo/configs-prettier'
```

### Method 3: Direct Import

For packages that need to extend the configuration:

```js
// prettier.config.js
import baseConfig from '@repo/configs-prettier'

export default {
  ...baseConfig,
  // Your overrides here
  printWidth: 120,  // Example override
}
```

## Ignore Files

The configuration includes a comprehensive `.prettierignore` file. To use it:

```bash
# Copy to your package root (if needed)
cp node_modules/@repo/configs-prettier/.prettierignore .
```

Or create a custom ignore file based on the package's needs.

## Import Order

The configuration automatically sorts imports following the scope-based architecture:

1. React imports
2. Next.js imports  
3. Third-party modules
4. Monorepo packages (`@repo/*`)
5. Component imports (`@/components/*`)
6. Hook imports (`@/hooks/*`)
7. Utility imports (`@/utils/*`)
8. Library imports (`@/lib/*`)
9. Type imports (`@/types/*`)
10. Constant imports (`@/constants/*`)
11. Other internal aliases (`@/*`)
12. Relative imports (`./`, `../`)

## Tailwind Support

Automatically sorts Tailwind CSS classes using these function names:

- `clsx`
- `cn`
- `cva` 
- `twMerge`
- `tw`

## File-Specific Rules

The configuration includes optimized formatting for:

- **TypeScript/JavaScript**: Standard formatting
- **JSON**: Wider print width, no trailing commas
- **Markdown**: Always wrap prose, wider print width
- **CSS/SCSS**: Double quotes for consistency
- **YAML**: Double quotes for compatibility
- **HTML/SVG**: Wider print width for readability

## Plugins Included

- `@ianvs/prettier-plugin-sort-imports` - Import sorting
- `prettier-plugin-tailwindcss` - Tailwind CSS class sorting

## Dependencies

This package includes the required Prettier plugins as dependencies, so you only need to install:

```bash
pnpm add -D prettier
```

The plugins are automatically available when using this configuration.

## Configuration Philosophy

This configuration follows best practices from Prettier v3.6.2:

- **ES Modules**: Uses modern ES module syntax for configuration
- **Type Safety**: Includes TypeScript type annotations
- **Performance**: Optimized parser selection for each file type
- **Consistency**: Enforces consistent formatting across the entire monorepo
- **Flexibility**: Easy to extend or override for specific packages

## Troubleshooting

### Import sorting not working?

Ensure your `tsconfig.json` has proper path mappings:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Tailwind classes not sorting?

Check that your utility function is listed in the `tailwindFunctions` array in the configuration.