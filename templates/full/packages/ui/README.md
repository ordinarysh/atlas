# Purpose

Base UI component library with accessible, composable React components styled with Tailwind CSS design tokens.

## Public Surface

- **Components**: `Button`, `Card`, `Text` base components
- **Utilities**: `cn()` className helper, component variants
- **Types**: Component prop interfaces and variant types
- **Exports**: Tree-shakeable ESM exports

## Responsibilities

- **Base Components**: Foundational UI building blocks
- **Accessibility**: ARIA attributes and keyboard navigation
- **Composability**: Components that work well together
- **Type Safety**: Full TypeScript support with strict types
- **Theme Integration**: Uses design system tokens

**What doesn't belong here:**
- Business logic (belongs in domains/)
- API calls (belongs in apps/)
- Complex forms (belongs in apps/)
- Design tokens (belongs in packages/design-system)

## Extension Points

### Using Components

```tsx
import { Button, Card, Text } from '@atlas/ui'

export function Feature() {
  return (
    <Card>
      <Text variant="heading">Welcome</Text>
      <Text>Build something amazing</Text>
      <Button variant="primary" size="lg">
        Get Started
      </Button>
    </Card>
  )
}
```

### Creating Component Variants

```tsx
// Custom button variant
import { Button } from '@atlas/ui'
import { cn } from '@atlas/ui/utils'

export function BrandButton({ className, ...props }) {
  return (
    <Button
      className={cn(
        'bg-brand hover:bg-brand-dark',
        className
      )}
      {...props}
    />
  )
}
```

### Adding New Components

```tsx
// src/tooltip.tsx
import { forwardRef } from 'react'
import { cn } from './utils'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, side = 'top', ...props }, ref) => {
    return (
      <div className="relative group" ref={ref} {...props}>
        {children}
        <div
          className={cn(
            'absolute bg-surface border rounded-md px-3 py-1 text-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'pointer-events-none z-50',
            {
              'bottom-full left-1/2 transform -translate-x-1/2 mb-2': side === 'top',
              'top-full left-1/2 transform -translate-x-1/2 mt-2': side === 'bottom',
              'right-full top-1/2 transform -translate-y-1/2 mr-2': side === 'left',
              'left-full top-1/2 transform -translate-y-1/2 ml-2': side === 'right'
            }
          )}
        >
          {content}
        </div>
      </div>
    )
  }
)
```

## Testing

```bash
# Run component tests
pnpm test

# Run specific test
pnpm test button.test.tsx

# Visual testing
pnpm storybook
```

## Links

- **Design System**: [../design-system/README.md](../design-system/README.md)
- **Web App Usage**: [../../apps/web/README.md](../../apps/web/README.md)
- **Component Patterns**: [../../docs/conventions.md](../../docs/conventions.md)
- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)

*Last reviewed: 2025-08-16*