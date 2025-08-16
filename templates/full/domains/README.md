# Domains

Domain slices containing pure business logic and UI components. Each domain is self-contained with zero knowledge of infrastructure.

## Architecture Rules

1. **No infrastructure imports**: Domains cannot import React Query, Next.js, fetch, or any infra code
2. **Pure TypeScript/Zod**: Business logic uses only TypeScript and Zod for schemas
3. **UI components are dumb**: Components receive data via props, no fetching
4. **Single source of truth**: All schemas defined here, other layers validate against them
5. **Immutable operations**: All logic functions return new objects

## File Structure

```
domain-name/
├── schemas.ts      # Zod schemas (boundary contracts)
├── types.ts        # TypeScript types (derived from schemas)
├── keys.ts         # Query key factory (pure functions)
├── logic.ts        # Business logic (pure functions)
├── fixtures.ts     # Test data and seeds
├── components/     # UI components (presentational only)
│   ├── List.tsx
│   ├── Item.tsx
│   ├── Empty.tsx
│   ├── Error.tsx
│   └── Skeleton.tsx
├── index.ts        # Public API exports
├── package.json    # Domain package config
└── tsconfig.json   # TypeScript config
```

## Creating a New Domain (Copy Checklist)

To create a new domain from the `todos` example:

1. **Copy the structure**:
   ```bash
   cp -r domains/todos domains/your-domain
   cd domains/your-domain
   ```

2. **Update package.json**:
   - Change `name` to `@atlas/your-domain`
   - Update description

3. **Define schemas** (`schemas.ts`):
   - Core entity schema
   - Create/Update schemas
   - List schema

4. **Export types** (`types.ts`):
   - Use `z.infer` to derive from schemas
   - Keep surface area minimal

5. **Create query keys** (`keys.ts`):
   - Factory pattern for stable keys
   - NO React Query imports

6. **Add business logic** (`logic.ts`):
   - Pure functions only
   - Immutable operations
   - Domain-specific helpers

7. **Build components** (`components/`):
   - Presentational only
   - Props for all data/callbacks
   - Follow Context 7 Tailwind conventions

8. **Wire up exports** (`index.ts`):
   - Export public API
   - Group by category

9. **Update workspace**:
   - Run `pnpm install` from root
   - Import in services/API as needed

## Context 7 Tailwind Conventions

- `text-*` for size/line-height only
- `font-*` for weight
- `text-color-*` for semantic colors
- Native Tailwind for spacing/layout

## Testing

Domains should have unit tests for:
- Schema validation
- Business logic functions  
- Component rendering

Integration testing happens at the API/hooks layer.