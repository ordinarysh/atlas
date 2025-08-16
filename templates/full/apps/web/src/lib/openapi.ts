/**
 * OpenAPI documentation generation utilities
 * Generates API documentation from Zod schemas and route handlers
 */

import type { ZodTypeAny } from 'zod'
import { features } from '@/lib/config'

/**
 * OpenAPI specification structure
 */
export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
  }
  servers: Array<{
    url: string
    description: string
  }>
  paths: Record<string, PathItem>
  components?: {
    schemas?: Record<string, SchemaObject>
    securitySchemes?: Record<string, SecuritySchemeObject>
  }
}

interface PathItem {
  get?: OperationObject
  post?: OperationObject
  put?: OperationObject
  patch?: OperationObject
  delete?: OperationObject
  options?: OperationObject
}

interface OperationObject {
  summary?: string
  description?: string
  tags?: string[]
  parameters?: ParameterObject[]
  requestBody?: RequestBodyObject
  responses: Record<string, ResponseObject>
  security?: Array<Record<string, string[]>>
}

interface ParameterObject {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  description?: string
  required?: boolean
  schema: SchemaObject
}

interface RequestBodyObject {
  description?: string
  required?: boolean
  content: Record<string, MediaTypeObject>
}

interface ResponseObject {
  description: string
  content?: Record<string, MediaTypeObject>
}

interface MediaTypeObject {
  schema: SchemaObject
  examples?: Record<string, ExampleObject>
}

interface ExampleObject {
  summary?: string
  description?: string
  value: unknown
}

interface SchemaObject {
  type?: string
  properties?: Record<string, SchemaObject>
  required?: string[]
  items?: SchemaObject
  enum?: unknown[]
  description?: string
  example?: unknown
  format?: string
  pattern?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  nullable?: boolean
  default?: unknown
}

interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
  scheme?: string
  bearerFormat?: string
  name?: string
  in?: 'query' | 'header' | 'cookie'
  description?: string
}

/**
 * Route documentation metadata interface
 */
export interface RouteDocumentation {
  summary?: string
  description?: string
  tags?: string[]
  bodySchema?: ZodTypeAny
  querySchema?: ZodTypeAny
  paramsSchema?: ZodTypeAny
  responseSchema?: ZodTypeAny
  examples?: {
    request?: unknown
    response?: unknown
  }
  security?: boolean
}

/**
 * Registry to store route documentation
 */
class OpenAPIRegistry {
  private routes = new Map<string, Map<string, RouteDocumentation>>()

  /**
   * Register a route with documentation
   */
  registerRoute(
    path: string,
    method: string,
    documentation: RouteDocumentation
  ): void {
    if (!this.routes.has(path)) {
      this.routes.set(path, new Map())
    }
    this.routes.get(path)!.set(method.toLowerCase(), documentation)
  }

  /**
   * Get all registered routes
   */
  getRoutes(): Map<string, Map<string, RouteDocumentation>> {
    return this.routes
  }

  /**
   * Clear all registered routes
   */
  clear(): void {
    this.routes.clear()
  }
}

export const openAPIRegistry = new OpenAPIRegistry()

/**
 * Convert Zod schema to OpenAPI schema (simplified implementation)
 * This is a basic implementation - for production, consider using a proper library
 * when Zod 4 compatibility is available
 */
function zodToOpenAPISchema(schema: ZodTypeAny): SchemaObject {
  // This is a simplified implementation
  // In a real implementation, you'd handle all Zod types properly
  const zodDef = (
    schema as unknown as {
      _def: {
        typeName: string
        checks?: unknown[]
        type?: ZodTypeAny
        innerType?: ZodTypeAny
        shape?: () => Record<string, ZodTypeAny>
      }
    }
  )._def

  if (zodDef.typeName === 'ZodString') {
    const checks = zodDef.checks as Array<{
      kind: string
      value?: number
      regex?: { source: string }
    }>
    return {
      type: 'string',
      minLength: checks?.find((c) => c.kind === 'min')?.value,
      maxLength: checks?.find((c) => c.kind === 'max')?.value,
      pattern: checks?.find((c) => c.kind === 'regex')?.regex?.source,
    }
  }

  if (zodDef.typeName === 'ZodNumber') {
    const checks = zodDef.checks as Array<{ kind: string; value?: number }>
    return {
      type: 'number',
      minimum: checks?.find((c) => c.kind === 'min')?.value,
      maximum: checks?.find((c) => c.kind === 'max')?.value,
    }
  }

  if (zodDef.typeName === 'ZodBoolean') {
    return { type: 'boolean' }
  }

  if (zodDef.typeName === 'ZodArray') {
    if (!zodDef.type) return { type: 'array' }
    return {
      type: 'array',
      items: zodToOpenAPISchema(zodDef.type),
    }
  }

  if (zodDef.typeName === 'ZodObject') {
    const properties: Record<string, SchemaObject> = {}
    const required: string[] = []

    const shape = zodDef.shape?.()
    if (!shape) return { type: 'object' }

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToOpenAPISchema(value)

      // Check if field is required (simplified check)
      const fieldDef = (value as unknown as { _def: { typeName: string } })._def
      if (
        fieldDef.typeName !== 'ZodOptional' &&
        fieldDef.typeName !== 'ZodDefault'
      ) {
        required.push(key)
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
    }
  }

  if (zodDef.typeName === 'ZodOptional') {
    if (!zodDef.innerType) return { type: 'string', nullable: true }
    const innerSchema = zodToOpenAPISchema(zodDef.innerType)
    return {
      ...innerSchema,
      nullable: true,
    }
  }

  // Fallback
  return { type: 'string', description: 'Unknown schema type' }
}

/**
 * Generate OpenAPI specification from registered routes
 */
export function generateOpenAPISpec(baseUrl?: string): OpenAPISpec {
  const routes = openAPIRegistry.getRoutes()
  const paths: Record<string, PathItem> = {}

  for (const [path, methods] of routes) {
    const pathItem: PathItem = {}

    for (const [method, doc] of methods) {
      const operation: OperationObject = {
        summary: doc.summary,
        description: doc.description,
        tags: doc.tags,
        responses: {
          '200': (() => {
            const base = { description: 'Success' }
            if (!doc.responseSchema) return base

            const mediaType: MediaTypeObject = {
              schema: zodToOpenAPISchema(doc.responseSchema),
            }

            if (doc.examples?.response) {
              mediaType.examples = {
                default: {
                  summary: 'Example response',
                  value: doc.examples.response,
                },
              }
            }

            return {
              ...base,
              content: {
                'application/json': mediaType,
              },
            }
          })(),
          '400': {
            description: 'Bad Request',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'object',
                      properties: {
                        code: { type: 'string' },
                        message: { type: 'string' },
                        details: { type: 'object' },
                      },
                      required: ['code', 'message'],
                    },
                  },
                  required: ['error'],
                },
              },
            },
          },
          '500': {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'object',
                      properties: {
                        code: { type: 'string' },
                        message: { type: 'string' },
                      },
                      required: ['code', 'message'],
                    },
                  },
                  required: ['error'],
                },
              },
            },
          },
        },
      }

      // Add parameters for query and path params
      const parameters: ParameterObject[] = []

      if (doc.querySchema) {
        const querySchema = zodToOpenAPISchema(doc.querySchema)
        if (querySchema.properties) {
          for (const [name, schema] of Object.entries(querySchema.properties)) {
            parameters.push({
              name,
              in: 'query',
              required: querySchema.required?.includes(name) ?? false,
              schema,
            })
          }
        }
      }

      if (doc.paramsSchema) {
        const paramsSchema = zodToOpenAPISchema(doc.paramsSchema)
        if (paramsSchema.properties) {
          for (const [name, schema] of Object.entries(
            paramsSchema.properties
          )) {
            parameters.push({
              name,
              in: 'path',
              required: true,
              schema,
            })
          }
        }
      }

      if (parameters.length > 0) {
        operation.parameters = parameters
      }

      // Add request body for POST/PUT/PATCH methods
      if (['post', 'put', 'patch'].includes(method) && doc.bodySchema) {
        const mediaType: MediaTypeObject = {
          schema: zodToOpenAPISchema(doc.bodySchema),
        }

        if (doc.examples?.request) {
          mediaType.examples = {
            default: {
              summary: 'Example request',
              value: doc.examples.request,
            },
          }
        }

        operation.requestBody = {
          required: true,
          content: {
            'application/json': mediaType,
          },
        }
      }

      // Add security if required
      if (doc.security) {
        operation.security = [{ bearerAuth: [] }]
      }

      pathItem[method as keyof PathItem] = operation
    }

    paths[path] = pathItem
  }

  return {
    openapi: '3.0.0',
    info: {
      title: 'Atlas API',
      version: '1.0.0',
      description: 'Production-ready API built with Next.js and TypeScript',
    },
    servers: [
      {
        url:
          baseUrl ??
          (features.isDevelopment
            ? 'http://localhost:3000'
            : 'https://api.example.com'),
        description: features.isDevelopment
          ? 'Development server'
          : 'Production server',
      },
    ],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
    },
  }
}

/**
 * Decorator to add documentation to API routes
 */
export function documentRoute(
  path: string,
  method: string,
  documentation: RouteDocumentation
) {
  return function <T extends (...args: unknown[]) => unknown>(target: T): T {
    // Register the route documentation
    openAPIRegistry.registerRoute(path, method, documentation)
    return target
  }
}

/**
 * Helper to register route documentation
 * Use this in your route handlers to add documentation
 */
export function registerRouteDoc(
  path: string,
  method: string,
  documentation: RouteDocumentation
): void {
  openAPIRegistry.registerRoute(path, method, documentation)
}
