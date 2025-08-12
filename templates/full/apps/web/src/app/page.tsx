import { EnvDemo } from '@/components/env-demo'
import { envPublic, envServer } from '@/env'

export default function Home() {
  // Example of server-side environment access in a Server Component
  // This is safe because page.tsx runs on the server by default
  const nodeEnv = envServer.NODE_ENV
  const hasDatabase = !!envServer.DATABASE_URL

  return (
    <div className="mx-auto max-w-4xl p-8 py-16">
      <main className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {envPublic.NEXT_PUBLIC_APP_NAME}
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            A bulletproof, production-ready Next.js template with type-safe
            environment validation.
            <br />
            Built with Next.js 15, TypeScript, Zod, and enterprise-grade
            security.
          </p>
        </div>

        {/* Environment Demo */}
        <EnvDemo />

        {/* Server Environment Status */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">
            🖥️ Server Environment Status
          </h2>
          <div className="grid gap-3 text-sm">
            <div>
              <strong>Environment:</strong>{' '}
              <span className="rounded bg-gray-100 px-2 py-1 font-mono">
                {String(nodeEnv)}
              </span>
            </div>
            <div>
              <strong>Database:</strong>{' '}
              {hasDatabase ? '✅ Connected' : '❌ Not configured'}
            </div>
          </div>
          <div className="mt-4 rounded border border-blue-300 bg-blue-100 p-3 text-xs text-blue-800">
            <strong>🔒 Security Note:</strong> This server component can safely
            access both public and server-only environment variables because it
            runs only on the server.
          </div>
        </div>

        {/* Documentation */}
        <article className="prose prose-lg mx-auto">
          <h2>Quick Start</h2>
          <ol>
            <li>
              <strong>Environment Setup:</strong> Copy <code>.env.example</code>{' '}
              to <code>.env.local</code> and configure your environment
              variables
            </li>
            <li>
              <strong>Install Dependencies:</strong> Run{' '}
              <code>pnpm install</code> to get started
            </li>
            <li>
              <strong>Environment Validation:</strong> The app will validate all
              environment variables on startup using Zod schemas
            </li>
            <li>
              <strong>Start Development:</strong> Run <code>pnpm dev</code> to
              start the development server
            </li>
          </ol>

          <h2>Features</h2>
          <ul>
            <li>
              🔐 <strong>Bulletproof Environment Validation:</strong> Type-safe
              Zod schemas with runtime guards
            </li>
            <li>
              🛡️ <strong>Security-First:</strong> Server secrets protected from
              client-side access
            </li>
            <li>
              ⚡ <strong>Edge/SSR Compatible:</strong> Works in all Next.js
              rendering modes
            </li>
            <li>
              🧪 <strong>Comprehensive Testing:</strong> Full test coverage with
              Vitest
            </li>
            <li>⚡ Tailwind CSS v4 with static compilation</li>
            <li>📝 Typography plugin for beautiful prose</li>
            <li>🎨 Modern OKLCH color system</li>
            <li>🌗 Dark mode ready with CSS variables</li>
            <li>📱 Responsive design with container queries</li>
            <li>♿ Accessibility-first approach</li>
            <li>🚀 Optimized for performance</li>
          </ul>

          <h2>Project Structure</h2>
          <pre>
            <code>{`monorepo/
├── apps/
│   └── web/              # Your Next.js application
├── packages/
│   ├── ui/               # Shared UI components & theme
│   ├── eslint-config/    # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
└── turbo.json            # Turborepo configuration`}</code>
          </pre>

          <h3>Customization Tips</h3>
          <p>
            This boilerplate is designed to be{' '}
            <strong>minimal yet extensible</strong>. Start by updating the brand
            colors in the theme file, then add your own components as needed.
          </p>

          <blockquote>
            <p>
              💡 <strong>Pro tip:</strong> Use the <code>prose</code> class from
              the Typography plugin for any content-heavy pages like blogs,
              documentation, or marketing pages.
            </p>
          </blockquote>
        </article>

        {/* Links Section */}
        <div className="flex flex-wrap justify-center gap-4 border-t pt-8">
          <a
            className="bg-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            href="https://v4.tailwindcss.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tailwind CSS v4 Docs
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50"
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js Docs
          </a>
          <a
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-neutral-50"
            href="https://turbo.build/repo/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Turborepo Docs
          </a>
        </div>
      </main>
    </div>
  )
}
