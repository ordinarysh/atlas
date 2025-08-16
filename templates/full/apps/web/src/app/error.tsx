'use client'

import { useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from '@atlas/ui'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-danger">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Text className="text-fg-muted">
            An unexpected error occurred while loading this page.
          </Text>

          {isDev && error.message && (
            <div className="border-danger/20 bg-danger/5 rounded-lg border p-3">
              <Text size="sm" className="text-danger font-mono">
                {error.message}
              </Text>
              {error.digest && (
                <Text size="xs" className="text-fg-muted mt-1">
                  Error ID: {error.digest}
                </Text>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={reset} className="w-full">
              Try again
            </Button>
            <Button
              variant="ghost"
              onClick={() => (window.location.href = '/')}
              className="w-full"
            >
              Go home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
