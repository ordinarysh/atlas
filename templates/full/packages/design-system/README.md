# Atlas Design System

Minimal, production-grade semantic token layer for Tailwind CSS v4. Zero runtime dependencies, CSS-first approach with automatic light/dark mode support.

## Summary

This package provides:
- **Tailwind preset** with semantic color and typography tokens
- **CSS variables** for light/dark themes using OKLCH color space
- **Zero runtime dependencies** - pure CSS and TypeScript
- **Tailwind v4 CSS-first** approach using `@theme` directive
- **ESM-only** with tree-shaking support (`sideEffects: false`)

## Quickstart

### 1. Install in your template
Already available as workspace dependency:
```bash
pnpm add @atlas/design-system
```

### 2. Add to tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss'
import { atlasPreset } from '@atlas/design-system'

const config: Config = {
  presets: [atlasPreset()],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
}

export default config
```

### 3. Import CSS in globals.css
```css
@import '@atlas/design-system/styles.css';
@import 'tailwindcss';
```

### 4. Enable dark mode
```tsx
// Add data-theme attribute to <html> element
<html data-theme="dark">
  <body>{children}</body>
</html>
```

## Semantic Colors

| Token | Usage | Light Value | Dark Value |
|-------|-------|-------------|------------|
| `fg` | Primary text | Near black | Near white |
| `fg-muted` | Secondary text | Gray | Light gray |
| `surface` | Card backgrounds | White | Dark surface |
| `elevated` | Elevated surfaces | Off-white | Elevated dark |
| `muted` | Muted backgrounds | Light gray | Muted dark |
| `primary` | Primary actions | Brand blue | Light blue |
| `primary-contrast` | Text on primary | White | Dark |
| `success` | Success states | Green | Light green |
| `warning` | Warning states | Amber | Light amber |
| `danger` | Error states | Red | Light red |
| `border` | Borders | Light gray | Dark gray |
| `ring` | Focus rings | Brand blue | Light blue |
| `outline` | Subtle outlines | Gray | Dark gray |

## Typography Scale

| Class | Font Size | Line Height | Usage |
|-------|-----------|-------------|-------|
| `text-3xl` | 1.802rem | 1.2 | Large headings |
| `text-2xl` | 1.602rem | 1.2 | Section headings |
| `text-xl` | 1.424rem | 1.2 | Subsection headings |
| `text-lg` | 1.266rem | 1.3 | Lead text |
| `text-md` | 1.125rem | 1.4 | Enhanced body |
| `text-base` | 1rem | 1.4 | Body text |
| `text-sm` | 0.889rem | 1.5 | Small text |
| `text-xs` | 0.790rem | 1.5 | Captions |

## Usage Examples

### Button Components
```tsx
// Primary button with semantic tokens
<button className="bg-primary text-primary-contrast text-sm font-medium rounded-md px-3 py-2 hover:opacity-90 focus:ring-2 focus:ring-ring">
  Submit Form
</button>

// Secondary button
<button className="bg-surface text-fg border border-border text-sm font-medium rounded-md px-3 py-2 hover:bg-elevated">
  Cancel
</button>
```

### Cards and Layouts
```tsx
// Card with proper semantic tokens
<div className="bg-surface text-fg border-border border rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-medium text-fg mb-2">Card Title</h3>
  <p className="text-sm text-fg-muted">Secondary description text</p>
</div>

// Status indicators
<div className="flex gap-2">
  <span className="text-success text-sm">✓ Completed</span>
  <span className="text-warning text-sm">⚠ Pending</span>
  <span className="text-danger text-sm">✗ Failed</span>
</div>
```

## Conventions

### Typography
- **`text-*` classes**: Size + line-height only (e.g., `text-lg`, `text-sm`)
- **`font-*` classes**: Weight only (e.g., `font-medium`, `font-bold`)
- Use semantic names: `font-normal` (400), `font-medium` (500), `font-bold` (700)

### Colors
- Use native Tailwind utilities: `text-*`, `bg-*`, `border-*`
- **No `text-color-*` utilities** - use standard `text-primary`, `text-fg`, etc.
- Prefer semantic names over appearance: `primary` not `blue`, `fg` not `gray-900`

### Spacing & Layout
- Use Tailwind's default spacing scale (`p-4`, `m-2`, `gap-3`)
- Use Tailwind's default shadows (`shadow-sm`, `shadow-lg`)
- No custom spacing tokens - Tailwind defaults are excellent

## Theming

### Light/Dark Mode
Themes are controlled via the `data-theme` attribute:

```tsx
// Light mode (default)
<html data-theme="light">

// Dark mode
<html data-theme="dark">

// System preference
const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
```

### Brand Extension
Override CSS variables to customize for your brand:

```css
/* In your app's CSS */
:root {
  /* Override primary brand color */
  --primary: 0.65 0.18 250;  /* Custom purple */
  --primary-contrast: 1 0 0; /* White text */
}

[data-theme="dark"] {
  --primary: 0.75 0.18 250;  /* Lighter for dark mode */
}

/* Add custom brand tokens */
:root {
  --brand-accent: 0.7 0.15 280;
  --brand-gradient: linear-gradient(135deg, oklch(var(--primary)), oklch(var(--brand-accent)));
}
```

Then extend your Tailwind config:
```typescript
// tailwind.config.ts
export default {
  presets: [atlasPreset()],
  theme: {
    extend: {
      colors: {
        'brand-accent': 'oklch(var(--brand-accent))',
      }
    }
  }
}
```

## FAQ

### Why no spacing or shadow tokens?
Tailwind's default spacing (`p-1` through `p-96`) and shadow utilities (`shadow-sm`, `shadow-xl`) are exceptionally well-designed and widely adopted. Adding custom tokens would create inconsistency and reduce interoperability with the broader Tailwind ecosystem.

**Use Tailwind defaults:**
- Spacing: `p-4`, `m-2`, `gap-6`, `space-y-3`
- Shadows: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`
- Z-index: `z-10`, `z-20`, `z-30`, `z-50`

### How to add brand-specific tokens?
Extend the system by overriding CSS variables and extending your Tailwind config:

1. **Add CSS variables** in your app's CSS file
2. **Extend colors** in your `tailwind.config.ts`
3. **Keep semantic naming**: `brand-accent` not `purple-500`

Example:
```css
/* app/globals.css */
:root {
  --brand-secondary: 0.6 0.2 180;
}
```

```typescript
// tailwind.config.ts
export default {
  presets: [atlasPreset()],
  theme: {
    extend: {
      colors: {
        'brand-secondary': 'oklch(var(--brand-secondary))',
      }
    }
  }
}
```

### Why OKLCH instead of HSL?
OKLCH provides perceptually uniform color space, meaning:
- Consistent visual brightness across hues
- Better automatic dark mode generation
- More predictable color mixing
- Future-proof for wide gamut displays

### Can I use this with Tailwind v3?
No, this package requires Tailwind CSS v4's CSS-first approach and `@theme` directive. For v3 compatibility, you'd need to manually extract the color values and add them to your config.

## Versioning

- **ESM-only**: Requires `"type": "module"` in your package.json
- **Tree-shakeable**: Package marked with `"sideEffects": false`
- **TypeScript**: Full type definitions included
- **Node.js**: Requires Node 18+ for ESM import maps support

## License

MIT