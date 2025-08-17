import { NextResponse, type NextRequest } from 'next/server'
import { apiResponse, withErrorHandling } from '@/lib/api-utils'
import { features } from '@/lib/config'
import { createCorsPreflightResponse } from '@/lib/cors'
import { generateOpenAPISpec } from '@/lib/openapi'

/**
 * GET /api/docs
 * Returns OpenAPI specification in JSON format
 */
export const GET = withErrorHandling(
  (request: NextRequest): Promise<NextResponse> => {
    // Only allow documentation access in development, test, or if explicitly enabled
    if (
      !features.isDevelopment &&
      process.env.NODE_ENV !== 'test' &&
      !process.env.ENABLE_API_DOCS
    ) {
      return Promise.resolve(apiResponse({ error: 'Not Found' }, 404))
    }

    try {
      // Get the base URL from the request
      const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
      const _openAPISpec = generateOpenAPISpec(baseUrl)

      // Return HTML page with embedded OpenAPI spec for documentation viewer
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: '${baseUrl}/api/docs/spec',
            dom_id: '#swagger-ui',
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIBundle.presets.standalone
            ]
        });
    </script>
</body>
</html>`

      return Promise.resolve(
        new NextResponse(htmlContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        })
      )
    } catch (error) {
      console.error('Failed to generate OpenAPI spec:', error)
      return Promise.resolve(
        apiResponse({ error: 'Internal Server Error' }, 500)
      )
    }
  }
)

/**
 * OPTIONS /api/docs
 * Handle preflight requests
 */
export function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return createCorsPreflightResponse(origin, {
    allowedMethods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
}
