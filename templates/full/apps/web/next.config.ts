import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // typedRoutes: true, // Disabled for Turbopack compatibility
  },

  // Compiler options for production optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
    ],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Turbopack configuration for optimal performance
  turbopack: {
    // Module resolution extensions (includes defaults + custom)
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'],
  },
}

export default nextConfig
