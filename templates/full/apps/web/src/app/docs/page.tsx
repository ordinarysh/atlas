'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'

/**
 * API Documentation page with Swagger UI
 * Only available in development or when explicitly enabled
 */
export default function APIDocsPage() {
  const [spec, setSpec] = useState<object | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSpec() {
      try {
        const response = await fetch('/api/docs')
        if (!response.ok) {
          if (response.status === 404) {
            setError('API documentation is not available in production')
          } else {
            setError('Failed to load API documentation')
          }
          return
        }
        const data = (await response.json()) as { data: object }
        setSpec(data.data) // Unwrap the API response format
      } catch (error_) {
        setError('Failed to load API documentation')
        console.error('Error loading OpenAPI spec:', error_)
      } finally {
        setLoading(false)
      }
    }

    void fetchSpec()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto mb-4 h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-gray-800">
            Documentation Unavailable
          </h1>
          <p className="text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">
            To enable API documentation in production, set{' '}
            <code className="rounded bg-gray-100 px-2 py-1">
              ENABLE_API_DOCS=true
            </code>
          </p>
        </div>
      </div>
    )
  }

  if (!spec) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-semibold text-gray-800">
            No API Documentation Found
          </h1>
          <p className="text-gray-600">No documented API routes were found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-6 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold">Atlas API Documentation</h1>
          <p className="mt-2 text-blue-100">
            Interactive API documentation powered by OpenAPI
          </p>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="mx-auto max-w-7xl">
        <SwaggerUI
          spec={spec}
          docExpansion="list"
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          displayRequestDuration={true}
          tryItOutEnabled={true}
          filter={true}
          deepLinking={true}
          displayOperationId={false}
        />
      </div>
    </div>
  )
}
