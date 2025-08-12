'use client'

import { envPublic } from '@/env'

/**
 * Client Component demonstrating safe public environment usage
 *
 * ✅ This component can safely access envPublic variables
 * ❌ Attempting to access envServer would throw a runtime error
 */
export function EnvDemo() {
  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6">
      <h2 className="mb-4 text-xl font-semibold text-blue-900">
        🔧 Environment Configuration Demo
      </h2>

      <div className="grid gap-4 text-sm">
        <div>
          <strong>App Name:</strong> {envPublic.NEXT_PUBLIC_APP_NAME}
        </div>

        <div>
          <strong>App URL:</strong> {envPublic.NEXT_PUBLIC_APP_URL}
        </div>

        <div>
          <strong>API URL:</strong> {envPublic.NEXT_PUBLIC_API_URL}
        </div>
      </div>

      <div className="mt-4 rounded border border-green-300 bg-green-100 p-3 text-xs text-green-800">
        <strong>✅ Security Note:</strong> This client component can only access
        NEXT_PUBLIC_* environment variables. Server-only secrets are protected
        and would throw an error if accessed here.
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
          View Code Example
        </summary>
        <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-3 text-xs">
          {`// ✅ Safe in Client Components
import { envPublic } from '@/env'
const appName = envPublic.NEXT_PUBLIC_APP_NAME

// ❌ Would throw runtime error in Client Components
import { envServer } from '@/env'
const dbUrl = envServer.DATABASE_URL // 🚨 Error!`}
        </pre>
      </details>
    </div>
  )
}
