# 🔤 Custom Font Setup Guide

Complete guide to adding custom fonts to your Tailwind CSS v4 monorepo boilerplate.

## 📁 File Structure

```
packages/ui/
├── src/
│   ├── fonts/              ← Store your font files here
│   │   ├── Inter-Variable.woff2
│   │   ├── Inter-Display.woff2
│   │   └── JetBrainsMono.woff2
│   └── theme.css           ← Define your font stacks here
```

## 🚀 Quick Setup (5 Steps)

### Step 1: Add Font Files

Place your `.woff2` files in `packages/ui/src/fonts/`:

```bash
# Download your fonts and place them in:
packages/ui/src/fonts/Your-Font.woff2
```

### Step 2: Define Font Faces

Add to `packages/ui/src/theme.css`:

```css
/**
 * Custom Font Definitions
 * Place these BEFORE @theme static
 */

@font-face {
  font-family: "Inter Variable";
  src: url("./fonts/Inter-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "JetBrains Mono";
  src: url("./fonts/JetBrainsMono.woff2") format("woff2");
  font-weight: 100 800;
  font-style: normal;
  font-display: swap;
}

@theme static {
  --*: initial;

  /* Update font stacks with your custom fonts */
  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Semantic font assignments */
  --font-body: var(--font-sans);
  --font-display: var(--font-sans); /* Use same for headings or different font */
  --font-code: var(--font-mono);

  /* Your colors... */
  --color-primary: oklch(0.545 0.218 264.5);
}
```

### Step 3: Copy Fonts to Public Directory

For each app, copy fonts to `public/fonts/`:

```bash
# Manual copy (run after adding fonts)
cp packages/ui/src/fonts/* apps/web/public/fonts/

# Or create a script (recommended for multiple apps)
node scripts/copy-fonts.js
```

### Step 4: Preload Fonts (Performance)

In each app's layout, preload critical fonts:

```tsx
// apps/web/src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts for performance */}
        <link
          rel="preload"
          href="/fonts/Inter-Variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

### Step 5: Use Your Fonts

```jsx
<div className="font-sans">Body text with Inter</div>
<h1 className="font-display text-4xl">Heading</h1>
<code className="font-mono">console.log("code")</code>
```

## 📋 Font Automation Script

Create `scripts/copy-fonts.js` for multiple apps:

```javascript
#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

async function copyFonts() {
  const fontSource = path.join(__dirname, "../packages/ui/src/fonts");
  const apps = ["web"]; // Add more apps: ['web', 'admin', 'mobile']

  for (const app of apps) {
    const destination = path.join(__dirname, `../apps/${app}/public/fonts`);

    try {
      // Ensure public/fonts directory exists
      await fs.ensureDir(destination);

      // Copy all fonts
      await fs.copy(fontSource, destination);
      console.log(`✓ Copied fonts to apps/${app}/public/fonts/`);
    } catch (error) {
      console.error(`✗ Failed to copy fonts to ${app}:`, error.message);
    }
  }
}

copyFonts();
```

Make it executable and add to package.json:

```bash
chmod +x scripts/copy-fonts.js
```

```json
{
  "scripts": {
    "fonts:copy": "node scripts/copy-fonts.js",
    "postinstall": "npm run fonts:copy"
  }
}
```

## 🎨 Font Recommendations

### Body Text Fonts

- **Inter** - Modern, highly legible
- **System UI** - Native system fonts
- **IBM Plex Sans** - Professional, open source

### Display/Heading Fonts

- **Inter Display** - Optimized for large sizes
- **Clash Display** - Geometric, modern
- **Fraunces** - Variable serif, expressive

### Code Fonts

- **JetBrains Mono** - Developer favorite
- **Fira Code** - Excellent ligatures
- **SF Mono** - Apple's system mono

## ⚡ Performance Best Practices

### 1. Font Loading Strategy

```css
@font-face {
  font-family: "Your Font";
  src: url("./fonts/your-font.woff2") format("woff2");
  font-display: swap; /* Critical for performance */
}
```

Font display options:

- `swap` - Show fallback immediately, swap when custom font loads
- `fallback` - Brief invisible period, then fallback, swap if font loads quickly
- `optional` - Only use custom font if it loads very quickly

### 2. Preload Critical Fonts

Only preload fonts used "above the fold":

```html
<!-- ✅ Good - Preload body font -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- ❌ Avoid - Don't preload every font -->
<link rel="preload" href="/fonts/display.woff2" as="font" type="font/woff2" crossorigin />
```

### 3. Use Variable Fonts

Variable fonts reduce file size and provide flexibility:

```css
/* One file, multiple weights */
@font-face {
  font-family: "Inter Variable";
  src: url("./fonts/Inter-Variable.woff2") format("woff2-variations");
  font-weight: 100 900; /* Range of available weights */
}
```

## 🛠️ Advanced: Next.js Font Optimization

For Google Fonts or better local font handling:

```tsx
// apps/web/src/app/layout.tsx
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

Update `theme.css`:

```css
@theme static {
  /* Next.js optimized fonts */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace;
}
```

## 🚨 Common Issues & Solutions

### Font Not Loading?

1. **Check file path**: Ensure `url('./fonts/Font.woff2')` matches actual file location
2. **Verify CORS**: Add `crossOrigin="anonymous"` to preload links
3. **Check network tab**: See if font files are 404ing
4. **Fallback fonts**: Ensure fallback fonts are working while debugging

### Font Looking Different Than Expected?

```css
/* Add font feature settings for consistent rendering */
--font-sans--font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
```

### Performance Issues?

1. **Use variable fonts** instead of multiple files
2. **Only preload critical fonts** (body text)
3. **Use `font-display: swap`**
4. **Optimize font files** with tools like `fonttools`

## 📖 Related Guides

- [Tailwind Setup Guide](./TAILWIND.md) - Main Tailwind configuration
- [Monorepo Guide](../README.md#monorepo-structure) - Understanding the workspace

## 💡 Pro Tips

1. **Test fallbacks**: Disable custom fonts to ensure fallbacks look good
2. **Use font pairing tools**: Like FontPair or Google Fonts combinations
3. **Consider system fonts**: They're fast and familiar to users
4. **Audit font usage**: Don't load fonts you're not using

---

Need help? Check the [Tailwind docs](https://v4.tailwindcss.com/docs/theme) or create an issue! 🎯
