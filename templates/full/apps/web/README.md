# Purpose

Next.js 15 web application providing API routes, authentication middleware, and frontend components with production-ready patterns.

## Public Surface

- **API Routes**: `/api/health`, `/api/auth/*`, `/api/projects`, `/api/metrics`, `/api/ready`, `/api/docs`
- **Route Handlers**: `GET`, `POST`, `PUT`, `DELETE` methods with type safety
- **Middleware**: Optional global rate limiting and authentication (disabled by default)
- **Components**: Base UI components and page layouts
- **Utilities**: Error handling, API helpers, validation schemas

## Responsibilities

- **API Endpoints**: Request/response handling with proper HTTP status codes
- **Route-Level Security**: Authentication and rate limiting applied per endpoint
- **Request Validation**: Input sanitization and schema validation
- **Error Handling**: Consistent error responses and logging
- **Frontend Components**: UI components and page routing
- **Static Assets**: Public files, fonts, images

## Extension Points

### Adding New API Routes

1. **Create Route Directory**
   ```bash
   mkdir -p src/app/api/new-endpoint
   ```

2. **Add Route Handler**
   ```typescript
   // src/app/api/new-endpoint/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { requireApiKey } from '@/lib/auth'
   import { requireRateLimit } from '@/lib/rate-limit'
   
   export async function GET(request: NextRequest) {
     const rateLimitResult = await requireRateLimit(request, { limiter: 'standard' })
     if (rateLimitResult.type === 'blocked') return rateLimitResult.response
     
     const auth = await requireApiKey('read:scope')
     if (auth instanceof NextResponse) return auth
     
     // Business logic here
     const data = { message: 'Hello World' }
     
     const response = NextResponse.json({ data })
     rateLimitResult.setHeaders(response)
     return response
   }
   ```

3. **Add Validation Schema**
   ```typescript
   // src/schemas/new-endpoint.ts
   import { z } from 'zod'
   
   export const NewEndpointSchema = z.object({
     name: z.string().min(1).max(100),
     data: z.object({}).optional()
   })
   ```

### Adding Frontend Pages

1. **Create Page File**
   ```typescript
   // src/app/new-page/page.tsx
   export default function NewPage() {
     return <div>New Page Content</div>
   }
   ```

2. **Add Layout (Optional)**
   ```typescript
   // src/app/new-page/layout.tsx
   export default function NewPageLayout({ children }: { children: React.ReactNode }) {
     return <div className="new-page-layout">{children}</div>
   }
   ```

### Enabling Global Middleware

1. **Activate Middleware File**
   ```bash
   mv src/middleware.example.ts src/middleware.ts
   ```

2. **Configure Middleware Options**
   ```typescript
   // src/middleware.ts
   export const config = {
     matcher: ['/api/:path*', '/dashboard/:path*']
   }
   ```

## Testing

### API Route Testing
```typescript
// __tests__/api/health.test.ts
import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns health status', async () => {
    const request = new NextRequest('http://localhost/api/health')
    const response = await GET(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
  })
})
```

### Component Testing
```typescript
// __tests__/components/Button.test.tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

### Commands
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test health.test.ts

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## Links

- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **API Overview**: [../../docs/api-overview.md](../../docs/api-overview.md)
- **Authentication**: [../../docs/auth-and-security.md](../../docs/auth-and-security.md)
- **API Client**: [../../packages/api-client/README.md](../../packages/api-client/README.md)
- **Design System**: [../../packages/design-system/README.md](../../packages/design-system/README.md)

*Last reviewed: 2025-08-16*