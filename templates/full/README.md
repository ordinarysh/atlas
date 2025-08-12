# Atlas Full-Stack Template

Enterprise-grade TypeScript monorepo template with Next.js, Tailwind v4, and React Query.

## Quickstart

```bash
# Install dependencies
pnpm install

# Run development servers
pnpm dev

# Type check all packages
pnpm type-check

# Build all packages
pnpm build
```

## Folder Structure

```
templates/full/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   ├── lib/      # Utilities (api.ts)
│       │   └── hooks/    # Custom React hooks
│       └── tailwind.config.ts
├── packages/
│   ├── api-client/       # API client with type-safe requests
│   ├── design-system/    # Tailwind v4 preset & tokens
│   ├── query/           # React Query configuration
│   └── ui/              # React components
└── turbo.json           # Turborepo configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_URL` | Backend API URL (server-side) | `http://localhost:3000/api` |
| `NEXT_PUBLIC_API_URL` | Public API URL (client-side) | `/api` |

## API Client Usage

The template uses a factory pattern for API calls:

```ts
// lib/api.ts
import { createApi } from '@atlas/api-client'

export const makeApi = () =>
  createApi({
    baseUrl: typeof window === 'undefined'
      ? process.env.API_URL ?? 'http://localhost:3000/api'
      : '/api',
    getAuthToken: async () => null, // TODO(auth addon): replace later
  })

// Usage in components
import { makeApi } from '@/lib/api'

const todos = await makeApi().get('/todos')
```

## Dark Mode

Toggle dark mode by setting the `data-theme` attribute:

```tsx
// Enable dark mode
document.documentElement.setAttribute('data-theme', 'dark')

// Enable light mode
document.documentElement.setAttribute('data-theme', 'light')
```

## Design Tokens

The design system provides semantic color tokens via `@atlas/design-system`:

- `fg` / `fg-muted` - Text colors
- `surface` / `elevated` / `muted` - Background colors
- `primary` / `success` / `warning` / `danger` - State colors
- `border` / `ring` / `outline` - UI element colors

## Renaming the Template

To rename the template scope from `@atlas` to your organization:

```bash
# Replace @atlas with @yourorg
find . -type f -name "*.json" -o -name "*.ts" -o -name "*.tsx" | \
  xargs sed -i '' 's/@atlas/@yourorg/g'

# Update package names
find . -type f -name "package.json" | \
  xargs sed -i '' 's/"name": "@atlas/"name": "@yourorg/g'
```

## Scripts

- `pnpm dev` - Start development servers
- `pnpm build` - Build all packages
- `pnpm type-check` - Type check all packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run tests