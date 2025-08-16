# Purpose

Tailwind CSS v4 preset with semantic design tokens providing consistent theming and styling across the monorepo.

## Public Surface

- **Tailwind Preset**: Complete Tailwind configuration with custom utilities
- **Design Tokens**: Color palette, spacing, typography scales
- **CSS Variables**: Theme-aware custom properties
- **Dark Mode**: Automatic dark mode support with CSS variables
- **Base Styles**: Reset and global styles

## Responsibilities

- **Design Consistency**: Enforce visual consistency across all apps
- **Theme Management**: Light/dark mode with CSS custom properties
- **Typography Scale**: Consistent text sizing and line heights
- **Color System**: Semantic color tokens (primary, secondary, etc.)
- **Spacing System**: Consistent padding/margin scale

**What doesn't belong here:**
- Component implementations (belongs in packages/ui)
- Business logic (belongs in domains/)
- Application-specific styles (belongs in apps/)

## Extension Points

### Using the Preset

```javascript
// tailwind.config.js
import { preset } from '@atlas/design-system'

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
  // Add custom extensions
  theme: {
    extend: {
      colors: {
        brand: '#FF5733'
      }
    }
  }
}
```

### Setup CSS

```css
/* globals.css */
@import '@atlas/design-system/styles.css';
@import 'tailwindcss';
```

### Available Tokens

```css
/* Color tokens */
.text-primary    /* Primary text color */
.bg-surface      /* Surface background */
.border-subtle   /* Subtle borders */

/* Spacing */
.p-xs through .p-3xl
.gap-xs through .gap-3xl

/* Typography */
.text-xs through .text-5xl
.font-light through .font-black
```

### Dark Mode Toggle

```tsx
const toggleTheme = () => {
  const current = document.documentElement.getAttribute('data-theme')
  document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark')
}
```

### Custom Theme Extension

```javascript
// Advanced configuration
import { preset } from '@atlas/design-system'

export default {
  presets: [preset],
  theme: {
    extend: {
      colors: {
        accent: 'var(--accent)',
        'accent-foreground': 'var(--accent-foreground)'
      }
    }
  }
}
```

## Testing

```bash
# Validate theme tokens
pnpm test

# Build CSS
pnpm build

# Analyze CSS usage
pnpm theme:analyze
```

## Links

- **UI Components**: [../ui/README.md](../ui/README.md)
- **Web App**: [../../apps/web/README.md](../../apps/web/README.md)
- **Conventions**: [../../docs/conventions.md](../../docs/conventions.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)

*Last reviewed: 2025-08-16*