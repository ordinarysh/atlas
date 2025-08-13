import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Header } from '@/components/header'
import { themeScript } from '@/lib/theme-script'
import { envPublic, envServer } from '@/env'
import { Providers } from './providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: envPublic.NEXT_PUBLIC_APP_NAME,
  description: `${envPublic.NEXT_PUBLIC_APP_NAME} - A production-ready Next.js application`,
  metadataBase: new URL(envPublic.NEXT_PUBLIC_APP_URL),
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Example of server-only environment access
  // This is safe because layout.tsx runs only on the server
  const isDev = envServer.NODE_ENV === 'development'

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* Development indicator - only shows in dev mode */}
          {isDev && (
            <div className="border-l-4 border-yellow-500 bg-yellow-100 p-2 text-sm text-yellow-700">
              🚧 Development Mode - Environment: {String(envServer.NODE_ENV)}
            </div>
          )}
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}
