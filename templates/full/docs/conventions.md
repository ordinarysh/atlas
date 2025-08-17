# Conventions

Code standards, naming patterns, and development practices for consistent, maintainable code.

## Naming Conventions

### Files and Directories

- **Files**: `kebab-case.ts`, `PascalCase.tsx` (React components)
- **Directories**: `kebab-case/`
- **Tests**: `*.test.ts`, `*.spec.ts`, `__tests__/`
- **Types**: `types.ts`, `*.types.ts`

### Code

- **Variables/Functions**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **Enums**: `PascalCase` with `UPPER_SNAKE_CASE` values

```typescript
// Good
const apiClient = createClient();
const API_BASE_URL = process.env.API_URL;
interface UserProfile {}
enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
}

// Avoid
const api_client, APIClient, userprofile;
```

## TypeScript Patterns

### Strict Configuration

- All strict mode flags enabled
- No `any` types (use `unknown` instead)
- Explicit return types for public functions
- Prefer `interface` over `type` for object shapes

```typescript
// Good
interface CreateUserRequest {
  email: string;
  name: string;
}

async function createUser(data: CreateUserRequest): Promise<User> {
  // implementation
}

// Avoid
function createUser(data: any) {
  // no return type, any usage
}
```

### Error Handling

- Use Result types for expected errors
- Throw for unexpected/system errors
- Validate at boundaries with Zod

```typescript
import { z } from "zod";

const UserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

type CreateUserResult =
  | { success: true; user: User }
  | { success: false; error: "DUPLICATE_EMAIL" | "INVALID_DATA" };

async function createUser(data: unknown): Promise<CreateUserResult> {
  const parsed = UserSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "INVALID_DATA" };
  }
  // ... rest of implementation
}
```

## Testing Strategy

### Test Tiers

1. **Unit Tests**: Pure functions, utilities, isolated components
2. **Integration Tests**: API routes, database operations, service interactions
3. **E2E Tests**: Critical user flows, authentication, payment processes

### Test Organization

```
src/
  feature/
    feature.ts
    feature.test.ts        # Unit tests
    __tests__/
      feature.integration.test.ts  # Integration tests
```

### Test Naming

```typescript
describe("createUser", () => {
  it("creates user with valid data", () => {});
  it("returns error for duplicate email", () => {});
  it("validates required fields", () => {});
});
```

## Commit Conventions

### Format

```
type(scope): description

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructuring
- `test`: Add/update tests
- `chore`: Tooling, deps, config

### Examples

```bash
feat(auth): add HMAC signature validation
fix(rate-limit): handle Redis connection failures
docs(api): update authentication examples
```

## Pull Request Standards

### Requirements

- ✅ All tests pass
- ✅ TypeScript checks pass
- ✅ ESLint/Prettier applied
- ✅ Branch up to date with main
- ✅ Meaningful commit messages

### PR Description Template

```markdown
## Changes

- Brief bullet points of what changed

## Testing

- How the changes were tested
- Any manual testing performed

## Notes

- Breaking changes (if any)
- Migration steps (if any)
```

## Import Organization

### Order

1. Node modules
2. Internal packages (`@/`, `~/`)
3. Relative imports (`./`, `../`)

```typescript
// Good
import { NextRequest } from "next/server";
import { z } from "zod";

import { requireApiKey } from "@/lib/auth";
import { createClient } from "@/lib/api";

import { UserSchema } from "./schemas";
import { validateRequest } from "../utils";
```

### Path Aliases

```typescript
// Use configured aliases
import { Button } from "@/components/ui/button"; // ✅
import { Button } from "../../components/ui/button"; // ❌
```

## Error Patterns

### API Errors

```typescript
// Consistent error response format
interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

// Usage in route handlers
if (!isValid) {
  return NextResponse.json(
    {
      error: "VALIDATION_ERROR",
      message: "Invalid request data",
      details: validationErrors,
    },
    { status: 400 },
  );
}
```

### Client Errors

```typescript
// Use typed error classes
class ApiValidationError extends Error {
  constructor(public details: Record<string, string[]>) {
    super("Validation failed");
    this.name = "ApiValidationError";
  }
}
```

## Performance Guidelines

### Bundle Size

- Code split by route/feature
- Dynamic imports for heavy dependencies
- Tree-shake unused exports

### Database

- Use indexed fields in queries
- Implement pagination for lists
- Cache frequently accessed data

### APIs

- Implement rate limiting
- Use appropriate HTTP caching headers
- Validate requests early

## Links

- **Architecture**: [architecture.md](./architecture.md)
- **API Patterns**: [api-overview.md](./api-overview.md)
- **Testing Setup**: [ci-and-automation.md](./ci-and-automation.md)
