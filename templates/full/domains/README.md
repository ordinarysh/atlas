# Purpose

Business logic layer containing domain-specific features, validation rules, and workflows that coordinate between API routes and services.

## Public Surface

- **Domain Services**: Business logic functions exported from feature modules
- **Validation Schemas**: Zod schemas for domain entities and operations
- **Domain Types**: TypeScript interfaces for business entities
- **UI Components**: Presentational components with props-based data
- **Query Keys**: Stable query key factories for React Query integration

## Responsibilities

- **Business Logic**: Core domain rules and calculations
- **Data Validation**: Input sanitization and business rule enforcement
- **Schema Definition**: Single source of truth for entity structures
- **Component Presentation**: UI components without data fetching
- **Domain Modeling**: Entity definitions and relationships

**What doesn't belong here:**
- HTTP request/response handling (belongs in apps/web)
- Data persistence logic (belongs in services/repository)
- Infrastructure concerns (belongs in services/)
- React Query hooks or data fetching

## Extension Points

### Adding a New Domain

1. **Create Domain Directory**
   ```bash
   mkdir -p domains/projects
   cd domains/projects
   ```

2. **Define Core Schema**
   ```typescript
   // schemas.ts
   import { z } from 'zod'
   
   export const ProjectSchema = z.object({
     id: z.string(),
     name: z.string().min(1).max(100),
     description: z.string().max(500).optional(),
     status: z.enum(['draft', 'active', 'archived']),
     createdAt: z.date(),
     updatedAt: z.date()
   })
   
   export const CreateProjectSchema = ProjectSchema.omit({
     id: true,
     createdAt: true,
     updatedAt: true
   })
   
   export const UpdateProjectSchema = CreateProjectSchema.partial()
   ```

3. **Export Types**
   ```typescript
   // types.ts
   import { z } from 'zod'
   import { ProjectSchema, CreateProjectSchema } from './schemas'
   
   export type Project = z.infer<typeof ProjectSchema>
   export type CreateProject = z.infer<typeof CreateProjectSchema>
   export type UpdateProject = z.infer<typeof UpdateProjectSchema>
   ```

4. **Create Query Keys**
   ```typescript
   // keys.ts (pure functions only)
   export const projectKeys = {
     all: ['projects'] as const,
     lists: () => [...projectKeys.all, 'list'] as const,
     list: (filters: string) => [...projectKeys.lists(), { filters }] as const,
     details: () => [...projectKeys.all, 'detail'] as const,
     detail: (id: string) => [...projectKeys.details(), id] as const
   }
   ```

5. **Add Business Logic**
   ```typescript
   // logic.ts (pure functions)
   import { Project } from './types'
   
   export function calculateProjectProgress(project: Project): number {
     // Business logic here
     return 0.75 // Example
   }
   
   export function canPublishProject(project: Project): boolean {
     return project.status === 'draft' && project.name.length > 0
   }
   
   export function formatProjectStatus(status: Project['status']): string {
     const statusMap = {
       draft: 'Draft',
       active: 'Active',
       archived: 'Archived'
     }
     return statusMap[status]
   }
   ```

6. **Build UI Components**
   ```typescript
   // components/ProjectCard.tsx
   import { Project } from '../types'
   import { formatProjectStatus } from '../logic'
   
   interface ProjectCardProps {
     project: Project
     onEdit?: (project: Project) => void
     onDelete?: (id: string) => void
   }
   
   export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
     return (
       <div className="border rounded-lg p-4">
         <h3 className="font-semibold">{project.name}</h3>
         <p className="text-color-secondary">{formatProjectStatus(project.status)}</p>
         {/* No data fetching - all props-based */}
       </div>
     )
   }
   ```

7. **Package Configuration**
   ```json
   // package.json
   {
     "name": "@atlas/projects",
     "version": "0.0.0",
     "private": true,
     "main": "./src/index.ts",
     "types": "./src/index.ts"
   }
   ```

8. **Export Public API**
   ```typescript
   // index.ts
   // Schemas
   export * from './schemas'
   
   // Types  
   export * from './types'
   
   // Query Keys
   export * from './keys'
   
   // Business Logic
   export * from './logic'
   
   // Components
   export * from './components/ProjectCard'
   export * from './components/ProjectList'
   ```

### Domain Architecture Rules

1. **No Infrastructure Imports**: Domains cannot import React Query, Next.js, fetch, or infrastructure code
2. **Pure TypeScript/Zod**: Business logic uses only TypeScript and Zod for schemas
3. **Immutable Operations**: All functions return new objects, no mutations
4. **Component Props**: UI components receive all data via props, no data fetching
5. **Single Source of Truth**: All schemas defined in domains, other layers validate against them

## Testing

### Schema Validation Tests
```typescript
// __tests__/schemas.test.ts
import { ProjectSchema } from '../schemas'

describe('ProjectSchema', () => {
  it('validates correct project data', () => {
    const validProject = {
      id: '123',
      name: 'Test Project',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    expect(() => ProjectSchema.parse(validProject)).not.toThrow()
  })
  
  it('rejects invalid status', () => {
    const invalidProject = { /* ... */ status: 'invalid' }
    expect(() => ProjectSchema.parse(invalidProject)).toThrow()
  })
})
```

### Business Logic Tests
```typescript
// __tests__/logic.test.ts
import { canPublishProject } from '../logic'

describe('canPublishProject', () => {
  it('allows publishing draft projects with names', () => {
    const project = { status: 'draft', name: 'Valid Project' }
    expect(canPublishProject(project)).toBe(true)
  })
  
  it('prevents publishing active projects', () => {
    const project = { status: 'active', name: 'Active Project' }
    expect(canPublishProject(project)).toBe(false)
  })
})
```

### Component Tests
```typescript
// __tests__/ProjectCard.test.tsx
import { render, screen } from '@testing-library/react'
import { ProjectCard } from '../components/ProjectCard'

describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'Test Project',
    status: 'draft' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  it('renders project information', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
  })
})
```

### Commands
```bash
# Run domain tests
pnpm test domains/

# Run specific domain
pnpm test domains/projects

# Watch mode
pnpm test:watch domains/projects
```

## Links

- **Architecture**: [../docs/architecture.md](../docs/architecture.md)
- **API Integration**: [../apps/web/README.md](../apps/web/README.md)
- **Design System**: [../packages/design-system/README.md](../packages/design-system/README.md)
- **Conventions**: [../docs/conventions.md](../docs/conventions.md)

*Last reviewed: 2025-08-16*