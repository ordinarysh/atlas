# Purpose

Data access layer providing consistent CRUD operations, query abstractions, and persistence patterns for domain entities.

## Public Surface

- **Repository Interfaces**: Abstract contracts for data operations
- **Entity Repositories**: Concrete implementations for each domain entity
- **Query Builders**: Type-safe query construction utilities
- **Transaction Support**: Multi-operation atomic transactions
- **Migration Utilities**: Database schema versioning and updates

## Responsibilities

- **Data Persistence**: Create, read, update, delete operations
- **Query Abstraction**: Database-agnostic query interfaces
- **Transaction Management**: Coordinating multi-table operations
- **Connection Pooling**: Efficient database connection management
- **Schema Migrations**: Database structure evolution

**What doesn't belong here:**
- Business logic validation (belongs in domains/)
- HTTP request handling (belongs in apps/web)
- Authentication logic (belongs in packages/api-auth)

## Extension Points

### Adding a New Repository

1. **Define Repository Interface**
   ```typescript
   // src/interfaces/project-repository.ts
   import { Project, CreateProject, UpdateProject } from '@atlas/domains/project'
   
   export interface ProjectRepository {
     findById(id: string): Promise<Project | null>
     findByUserId(userId: string): Promise<Project[]>
     create(data: CreateProject): Promise<Project>
     update(id: string, data: UpdateProject): Promise<Project>
     delete(id: string): Promise<void>
     findByStatus(status: Project['status']): Promise<Project[]>
   }
   ```

2. **Implement Database Repository**
   ```typescript
   // src/implementations/prisma-project-repository.ts
   import { PrismaClient } from '@prisma/client'
   import { ProjectRepository } from '../interfaces/project-repository'
   
   export class PrismaProjectRepository implements ProjectRepository {
     constructor(private prisma: PrismaClient) {}
     
     async findById(id: string): Promise<Project | null> {
       const project = await this.prisma.project.findUnique({
         where: { id }
       })
       return project ? this.mapToProject(project) : null
     }
     
     async create(data: CreateProject): Promise<Project> {
       const project = await this.prisma.project.create({
         data: {
           ...data,
           id: generateId(),
           createdAt: new Date(),
           updatedAt: new Date()
         }
       })
       return this.mapToProject(project)
     }
     
     private mapToProject(data: any): Project {
       // Map database entity to domain entity
       return {
         id: data.id,
         name: data.name,
         description: data.description,
         status: data.status,
         createdAt: data.createdAt,
         updatedAt: data.updatedAt
       }
     }
   }
   ```

3. **Create Repository Factory**
   ```typescript
   // src/factory.ts
   import { ProjectRepository } from './interfaces/project-repository'
   import { PrismaProjectRepository } from './implementations/prisma-project-repository'
   import { MemoryProjectRepository } from './implementations/memory-project-repository'
   
   export function createProjectRepository(): ProjectRepository {
     if (process.env.NODE_ENV === 'test') {
       return new MemoryProjectRepository()
     }
     
     if (process.env.DATABASE_URL) {
       return new PrismaProjectRepository(prisma)
     }
     
     throw new Error('No database configuration found')
   }
   ```

4. **Export Repository Service**
   ```typescript
   // src/index.ts
   export const repositoryService = {
     projects: createProjectRepository(),
     users: createUserRepository(),
     // Add other repositories
   }
   ```

### Implementing Transactions

```typescript
// src/transaction-manager.ts
export interface TransactionManager {
  execute<T>(operation: (tx: Transaction) => Promise<T>): Promise<T>
}

// Usage in domain services
export async function transferProjectOwnership(
  projectId: string,
  fromUserId: string,
  toUserId: string
) {
  return transactionManager.execute(async (tx) => {
    const project = await tx.projects.findById(projectId)
    if (!project || project.ownerId !== fromUserId) {
      throw new Error('Project not found or unauthorized')
    }
    
    // Update project ownership
    await tx.projects.update(projectId, { ownerId: toUserId })
    
    // Log ownership transfer
    await tx.auditLogs.create({
      action: 'PROJECT_OWNERSHIP_TRANSFER',
      projectId,
      fromUserId,
      toUserId
    })
    
    return project
  })
}
```

### Query Builder Pattern

```typescript
// src/query-builder.ts
export class ProjectQueryBuilder {
  private conditions: any[] = []
  private orderBy: any[] = []
  private limitValue?: number
  
  byUserId(userId: string) {
    this.conditions.push({ ownerId: userId })
    return this
  }
  
  byStatus(status: Project['status']) {
    this.conditions.push({ status })
    return this
  }
  
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc') {
    this.orderBy.push({ createdAt: direction })
    return this
  }
  
  limit(count: number) {
    this.limitValue = count
    return this
  }
  
  async execute(): Promise<Project[]> {
    return prisma.project.findMany({
      where: { AND: this.conditions },
      orderBy: this.orderBy,
      take: this.limitValue
    })
  }
}

// Usage
const recentProjects = await new ProjectQueryBuilder()
  .byUserId(userId)
  .byStatus('active')
  .orderByCreatedAt('desc')
  .limit(10)
  .execute()
```

### Database Migrations

```typescript
// src/migrations/001_create_projects_table.ts
export async function up(db: Database) {
  await db.schema.createTable('projects', (table) => {
    table.string('id').primary()
    table.string('name').notNullable()
    table.text('description').nullable()
    table.enum('status', ['draft', 'active', 'archived']).defaultTo('draft')
    table.string('owner_id').notNullable()
    table.timestamps(true, true)
    
    table.index(['owner_id', 'status'])
    table.index(['created_at'])
  })
}

export async function down(db: Database) {
  await db.schema.dropTable('projects')
}
```

## Testing

### Repository Testing
```typescript
// __tests__/project-repository.test.ts
import { PrismaProjectRepository } from '../src/implementations/prisma-project-repository'

describe('PrismaProjectRepository', () => {
  let repository: PrismaProjectRepository
  let testDb: PrismaClient
  
  beforeEach(async () => {
    testDb = new PrismaClient()
    repository = new PrismaProjectRepository(testDb)
  })
  
  afterEach(async () => {
    await testDb.$disconnect()
  })
  
  it('creates and retrieves projects', async () => {
    const data = { name: 'Test Project', ownerId: 'user-1' }
    const project = await repository.create(data)
    
    expect(project.id).toBeDefined()
    expect(project.name).toBe('Test Project')
    
    const retrieved = await repository.findById(project.id)
    expect(retrieved).toEqual(project)
  })
  
  it('finds projects by user ID', async () => {
    await repository.create({ name: 'Project 1', ownerId: 'user-1' })
    await repository.create({ name: 'Project 2', ownerId: 'user-1' })
    await repository.create({ name: 'Project 3', ownerId: 'user-2' })
    
    const user1Projects = await repository.findByUserId('user-1')
    expect(user1Projects).toHaveLength(2)
  })
})
```

### Integration Testing
```typescript
// __tests__/integration/project-workflow.test.ts
import { repositoryService } from '../src'

describe('Project Workflow Integration', () => {
  it('handles complete project lifecycle', async () => {
    // Create project
    const project = await repositoryService.projects.create({
      name: 'Integration Test Project',
      ownerId: 'user-1'
    })
    
    // Update project
    const updated = await repositoryService.projects.update(project.id, {
      status: 'active'
    })
    expect(updated.status).toBe('active')
    
    // Verify in database
    const retrieved = await repositoryService.projects.findById(project.id)
    expect(retrieved?.status).toBe('active')
    
    // Clean up
    await repositoryService.projects.delete(project.id)
  })
})
```

### Commands
```bash
# Run repository tests
pnpm test services/repository

# Run integration tests
pnpm test:integration

# Run specific repository tests
pnpm test project-repository.test.ts

# Test with real database
DATABASE_URL=postgresql://... pnpm test
```

## Links

- **Architecture**: [../../docs/architecture.md](../../docs/architecture.md)
- **Domain Layer**: [../../domains/README.md](../../domains/README.md)
- **Rate Limiting**: [../rate-limit/README.md](../rate-limit/README.md)
- **Conventions**: [../../docs/conventions.md](../../docs/conventions.md)

*Last reviewed: 2025-08-16*