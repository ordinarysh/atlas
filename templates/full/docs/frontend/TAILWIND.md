# 🎨 Tailwind CSS Guide for Beginners

## What is Tailwind CSS?

Instead of writing CSS like this:

```css
.button {
  padding: 8px 16px;
  background: blue;
  color: white;
  border-radius: 8px;
}
```

With Tailwind, you write classes directly in HTML:

```html
<button class="rounded-lg bg-blue-500 px-4 py-2 text-white">Click me</button>
```

**Why is this good?**

- ✅ No switching between HTML and CSS files
- ✅ See exactly how something is styled
- ✅ No naming things (hardest problem in programming!)
- ✅ Tiny CSS bundle (only what you use)

## 📁 Why This Folder Structure?

```
your-project/
├── apps/
│   └── web/          ← Your actual website
├── packages/
│   └── ui/           ← Shared design & components
└── package.json
```

This is called a **monorepo** (one repository, multiple projects).

**Think of it like LEGO:**

- `packages/ui` = Your LEGO pieces (colors, components)
- `apps/web` = What you build with those pieces
- Later you can add `apps/mobile` or `apps/admin` using the SAME pieces!

## 🎯 How Tailwind Classes Work

### The Pattern

Most Tailwind classes follow this pattern:

```
{property}-{value}
```

**Examples:**

- `p-4` = **p**adding of size **4** (16px)
- `text-lg` = **text** size **l**ar**g**e
- `bg-blue-500` = **b**ack**g**round color **blue**, shade **500**
- `rounded-lg` = border-radius **l**ar**g**e

### Responsive Design

Add screen size prefixes:

```html
<div class="text-sm md:text-lg lg:text-xl">
  Small on mobile, larger on tablets, even larger on desktop
</div>
```

### States (Hover, Focus, etc.)

```html
<button class="bg-blue-500 hover:bg-blue-600 focus:ring-2">Hover me!</button>
```

## 🛠️ How Our Setup Works

### 1. **Design Tokens** (`packages/ui/src/theme.css`)

This minimal file only defines what YOU need to customize:

```css
--color-primary: oklch(0.545 0.218 264.5); /* Your brand color */
--font-sans: system-ui, sans-serif; /* Your fonts */
--color-success-500: oklch(0.65 0.15 145); /* Status colors */
```

**Everything else comes from Tailwind's excellent defaults!**

- Spacing (p-4, m-8) → Built-in 4px scale
- Text sizes (text-sm, text-2xl) → Built-in typography scale
- Colors (neutral-500, blue-600) → Built-in color palette

### 2. **App Styles** (`apps/web/src/app/globals.css`)

```css
/* 1. Import Tailwind */
@import "tailwindcss";

/* 2. Import shared design system */
@import "../../../../packages/ui/src/theme.css";

/* 3. Your app customizations */
@theme {
  --color-primary: oklch(0.6 0.2 200); /* Override for this app */
}
```

### 3. **Using Classes in Your Code**

```jsx
// apps/web/src/app/page.tsx
export default function Home() {
  return (
    <div className="p-8">
      {" "}
      {/* padding: 32px */}
      <h1 className="text-4xl font-bold">Title</h1> {/* Large, bold text */}
      <p className="text-neutral-600">Text</p> {/* Gray text */}
      <button className="bg-primary rounded px-4 py-2 text-white">Click me</button>
    </div>
  );
}
```

## 🎨 Customization Guide

### Change Your Brand Colors

Edit `packages/ui/src/theme.css`:

```css
/* Change from blue to green */
--color-primary: oklch(0.65 0.18 150); /* Hue 150 = green */
```

### Add Custom Classes

In `apps/web/src/app/globals.css`:

```css
@layer components {
  .btn {
    @apply rounded-lg px-4 py-2 font-medium; /* Combine utilities */
  }
}
```

Now use it:

```html
<button class="btn bg-primary text-white">Easier!</button>
```

### Create Arbitrary Values

When you need something specific:

```html
<div class="mt-[23px]">
  <!-- Margin-top: 23px -->
  <div class="text-[#1DA1F2]">
    <!-- Twitter blue -->
    <div class="w-[300px]"><!-- Width: 300px --></div>
  </div>
</div>
```

## 📝 The Typography Plugin

For blog posts, documentation, or any long-form content:

```jsx
<article className="prose">
  <h1>This heading is automatically styled!</h1>
  <p>So is this paragraph, with perfect spacing.</p>
  <ul>
    <li>Lists too!</li>
  </ul>
</article>
```

The `prose` class adds beautiful typography to ANY HTML content.

## 🌟 Common Patterns

### Flexbox Layout

```html
<div class="flex items-center justify-between gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

### Grid Layout

```html
<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

### Card Component

```html
<div class="rounded-lg border p-6 shadow-sm transition-shadow hover:shadow-lg">
  <h3 class="text-lg font-semibold">Card Title</h3>
  <p class="mt-2 text-neutral-600">Card content</p>
</div>
```

## ⚡ Why Tailwind v4?

**v3 (old way):**

- JavaScript config file
- Runtime CSS generation
- More complex setup

**v4 (our way):**

- CSS-only configuration
- Compile-time optimization
- Faster builds
- Simpler mental model

## 🎯 Quick Start Checklist

1. **Change colors**: Edit `packages/ui/src/theme.css`
2. **Add components**: Create in `packages/ui/src/components/`
3. **Override styles**: Use `apps/web/src/app/globals.css`
4. **Use classes**: Write them directly in your JSX/HTML

## 💡 Pro Tips

### IntelliSense (Auto-complete)

Install the Tailwind CSS IntelliSense VSCode extension for:

- Auto-complete classes
- See actual CSS values on hover
- Linting for invalid classes

### Class Organization

Keep classes readable:

```jsx
<div
  className="
    /* Layout */
    flex items-center justify-between

    /* Spacing */
    p-4 gap-4

    /* Style */
    bg-white rounded-lg shadow

    /* Responsive */
    md:p-6 lg:p-8
  "
>
```

### Don't Fight Tailwind

If you find yourself using lots of arbitrary values:

```html
<!-- ❌ Bad -->
<div class="mb-[17px] mt-[23px] pl-[31px]">
  <!-- ✅ Good - adjust your design to use theme values -->
  <div class="mb-4 mt-6 pl-8"></div>
</div>
```

## 🤔 Common Questions

**Q: Won't my HTML get messy with all these classes?** A: Yes, but your CSS stays tiny and you never
have dead styles!

**Q: What if I need the same styles in multiple places?** A: Create a component! That's why we have
`packages/ui/`.

**Q: How do I know what classes exist?** A: Use the [Tailwind docs](https://tailwindcss.com/docs) or
IntelliSense.

**Q: Why OKLCH colors?** A: Better color mixing and more consistent brightness. But you can use hex
too: `text-[#1DA1F2]`

## 🚀 Next Steps

1. **Play with classes** in `apps/web/src/app/page.tsx`
2. **Change a color** in `packages/ui/src/theme.css` and see it update everywhere
3. **Create a component** in `packages/ui/src/components/`
4. **Read the [Tailwind docs](https://tailwindcss.com/docs)** - they're excellent!

---

Remember: **Tailwind is just CSS shortcuts**. If you know `padding`, you know `p-4`. If you know
`display: flex`, you know `flex`. You got this! 🎉
