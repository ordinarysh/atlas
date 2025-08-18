# API Overview

Route handlers, controller patterns, and API architecture for building type-safe, secure APIs.

## Handler Location

All API handlers live in `apps/web/src/app/api/` using Next.js App Router conventions.

```
apps/web/src/app/api/
├── health/
│   └── route.ts           # GET /api/health
├── auth/
│   ├── route.ts           # POST /api/auth (login)
│   └── me/
│       └── route.ts       # GET /api/auth/me
├── projects/
│   └── route.ts           # GET/POST /api/projects
├── metrics/
│   └── route.ts           # GET /api/metrics
├── ready/
│   └── route.ts           # GET /api/ready
└── docs/
    └── route.ts           # GET /api/docs
```

## Controller Thinness

Controllers should be thin orchestration layers that:

- Handle HTTP concerns (request/response formatting)
- Delegate business logic to domain layers
- Apply cross-cutting concerns (auth, rate limiting)

```typescript
// Good: Thin controller
export async function GET(request: NextRequest) {
  // 1. Rate limiting
  const rateLimitResult = await requireRateLimit(request, { limiter: 'standard' })
  if (rateLimitResult.type === 'blocked') return rateLimitResult.response

  // 2. Authentication
  const auth = await requireApiKey('read:projects')
  if (auth instanceof NextResponse) return auth

  // 3. Business logic (delegated)
  const projects = await projectService.listProjects(auth.userId)

  // 4. Response formatting
  const response = NextResponse.json({ data: projects })
  rateLimitResult.setHeaders(response)
  return response
}

// Avoid: Fat controller with business logic
export async function GET(request: NextRequest) {
  // Don't put complex business logic here
  const user = await db.user.findUnique(...)
  if (user.subscription !== 'premium') {
    const projects = await db.project.findMany({
      where: { userId: user.id, status: 'active' },
      take: 5 // Free tier limit
    })
  }
  // ... lots of business logic
}
```

## Domain and Services Integration

### Request Flow

```
API Route → Domain Layer → Services Layer → Response
```

### Example Integration

```typescript
// apps/web/src/app/api/projects/route.ts
import { projectService } from "@/domains/project";

export async function POST(request: NextRequest) {
  const auth = await requireApiKey("write:projects");
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();

  // Delegate to domain layer
  const result = await projectService.createProject({
    userId: auth.userId,
    data: body,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, message: "Failed to create project" },
      { status: 400 },
    );
  }

  return NextResponse.json({ data: result.project }, { status: 201 });
}
```

## Response Envelope

### Standard Success Response

```typescript
interface SuccessResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
  };
}
```

### Standard Error Response

```typescript
interface ErrorResponse {
  error: string; // Machine-readable error code
  message: string; // Human-readable message
  details?: Record<string, unknown>; // Additional context
}
```

### HTTP Status Codes

- `200`: Success with data
- `201`: Resource created
- `204`: Success with no content
- `400`: Client error (validation, bad request)
- `401`: Authentication required
- `403`: Permission denied
- `404`: Resource not found
- `422`: Validation error
- `429`: Rate limit exceeded
- `500`: Server error

## Available Endpoints

### Health & Monitoring

- `GET /api/health` - Health check endpoint
- `GET /api/ready` - Readiness probe
- `GET /api/metrics` - Application metrics

### Authentication

- `POST /api/auth` - User authentication
- `GET /api/auth/me` - Current user profile

### Projects

- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project

### Documentation

- `GET /api/docs` - API documentation

## Input Validation

Use Zod schemas for request validation:

```typescript
import { z } from "zod";

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Use parsed.data (fully typed)
  const result = await projectService.createProject(parsed.data);
  // ...
}
```

## Error Handling

```typescript
import { withErrorHandling } from "@/lib/api-utils";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Your handler logic
  // Uncaught errors are handled by withErrorHandling
});
```

## Rate Limiting Integration

All endpoints should include rate limiting:

```typescript
export async function GET(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await requireRateLimit(request, {
    limiter: "standard", // or 'strict', 'permissive'
  });

  if (rateLimitResult.type === "blocked") {
    return rateLimitResult.response; // 429 with headers
  }

  // ... rest of handler

  // Apply headers to success response
  const response = NextResponse.json({ data });
  rateLimitResult.setHeaders(response);
  return response;
}
```

## Testing API Routes

```typescript
// __tests__/api/projects.test.ts
import { POST } from "@/app/api/projects/route";

describe("POST /api/projects", () => {
  it("creates project with valid data", async () => {
    const request = new NextRequest("http://localhost/api/projects", {
      method: "POST",
      headers: { "X-API-Key": "valid-key" },
      body: JSON.stringify({ name: "Test Project" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe("Test Project");
  });
});
```

## Links

- **Web App Structure**: [../apps/web/README.md](../apps/web/README.md)
- **Authentication**: [auth-and-security.md](./auth-and-security.md)
- **Rate Limiting**: [../services/rate-limit/README.md](../services/rate-limit/README.md)
- **API Client**: [../packages/api-client/README.md](../packages/api-client/README.md)
