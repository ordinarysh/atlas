# Atlas

A production-ready monorepo template for building modern web applications with Next.js 16, React 19, and Tailwind CSS. Includes pre-configured shared packages for UI components, TypeScript, ESLint, and Tailwind styling.

## Quick Start

### Prerequisites

- Node.js ≥ 18
- pnpm 10.19.0+

### Installation

```bash
# Clone and install
git clone https://github.com/ordinarysh/atlas.git
cd atlas
pnpm install

# Start development
pnpm dev
```

The web app runs on `http://localhost:3001`.

## What's Inside

### Apps

- **`web`** – Next.js 16 application with Tailwind CSS, React 19, and TypeScript. The main entry point for your application.

### Packages

- **`@ordinarysh/ui`** – Shared React component library with pre-compiled Tailwind CSS. Components are prefixed with `ui-` to avoid style conflicts. Built with TypeScript and exported as ESM.

- **`@ordinarysh/eslint-config`** – Shared ESLint configurations (flat config format, ESLint 9+):
  - `./base` – Base ESLint rules
  - `./next-js` – Next.js-specific rules
  - `./react-internal` – React component library rules

- **`@ordinarysh/typescript-config`** – Shared TypeScript configurations:
  - `nextjs.json` – For Next.js apps
  - `react-library.json` – For React packages

- **`@ordinarysh/tailwind-config`** – Shared Tailwind CSS configuration and PostCSS setup. Exports styles and PostCSS config for consistent styling across apps and packages.

## Development

### Available Commands

```bash
# Start all dev servers
pnpm dev

# Build all packages and apps
pnpm build

# Run linting
pnpm lint

# Type check
pnpm check-types

# Format code
pnpm format

# Check for outdated dependencies
pnpm ncu:check

# Update dependencies (interactive)
pnpm ncu
```

### Project Structure

```
atlas/
├── apps/
│   └── web/                    # Next.js 16 application
├── packages/
│   ├── ui/                     # React component library
│   ├── eslint-config/          # Shared ESLint configs
│   ├── typescript-config/      # Shared TypeScript configs
│   └── tailwind-config/        # Shared Tailwind setup
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace definition
└── package.json                # Root scripts and dependencies
```

## Tech Stack

- **Framework:** Next.js 16 (Turbopack)
- **Runtime:** React 19
- **Language:** TypeScript 5.9
- **Styling:** Tailwind CSS 4.1
- **Package Manager:** pnpm 10.19
- **Monorepo:** Turborepo 2.5
- **Linting:** ESLint 9.38 (flat config)
- **Formatting:** Prettier 3.6

## Building for Production

```bash
# Build all packages
pnpm build

# Start production server
cd apps/web
pnpm start
```

The build output is optimized with Turbopack and includes:
- Static page pre-rendering
- TypeScript compilation
- CSS optimization with Tailwind
- Code splitting and lazy loading

## Configuration

### Environment Variables

Create `.env.local` in `apps/web` for environment-specific settings:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Tailwind CSS

Customize styling in `packages/tailwind-config/tailwind.config.ts`. Changes automatically apply to all apps and packages.

### TypeScript

Each app/package extends a base config from `packages/typescript-config`. Modify base configs to enforce standards across the monorepo.

### ESLint

Each app/package uses a flat config (ESLint 9+) that imports from `packages/eslint-config`. Customize rules in respective `eslint.config.js` files.

## Monorepo Workflow

This project uses **Turborepo** for task orchestration and caching:

- Tasks run in parallel when possible
- Dependency graph ensures correct build order
- Outputs are cached for faster rebuilds
- Remote caching available via Vercel

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `apps/web`
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
CMD ["pnpm", "start"]
```

## Contributing

1. Create a feature branch
2. Make changes and test locally
3. Run `pnpm lint` and `pnpm check-types`
4. Commit and push
5. Open a pull request

## License

MIT
