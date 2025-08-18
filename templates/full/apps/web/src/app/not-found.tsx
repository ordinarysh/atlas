'use client'

import Link from 'next/link'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from '@atlas/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-fg text-3xl font-bold">404</CardTitle>
          <Text className="text-fg-muted">Page not found</Text>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <Text className="text-fg-muted">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </Text>

          <div className="flex flex-col gap-2">
            <Link href="/">
              <Button className="w-full">Go back home</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Go back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
