# @repo/ui

> **Shared UI components and design tokens for your monorepo**

## 📦 What's Included

A minimal design system built on **Tailwind CSS v4** that shares brand colors and components across all your apps.

### Structure

```
packages/ui/
├── src/
│   ├── theme.css      # Your brand colors & fonts
│   └── components/    # Shared React components (add your own!)
└── package.json
```

## 🎨 Customization

### Brand Colors

Edit `src/theme.css` to update your brand colors:

```css
--color-primary: oklch(0.545 0.218 264.5);  /* Your main brand color */
```

### Components

Add shared components in `src/components/`:

```tsx
// src/components/button.tsx
export function Button({ children, ...props }) {
  return (
    <button className="bg-primary text-white px-4 py-2 rounded-lg" {...props}>
      {children}
    </button>
  )
}
```

## 🚀 Usage in Apps

```tsx
// In any app
import { Button } from '@repo/ui/components/button'

export default function Page() {
  return <Button>Click me</Button>
}
```

## 📝 Philosophy

- **Minimal by default** - Only includes what every project needs
- **Easy to extend** - Add components and tokens as you grow
- **Tailwind powered** - Uses v4's excellent defaults for everything else

---

Built with Tailwind CSS v4 and ❤️