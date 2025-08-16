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
          // Frame protection
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Content type protection
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HTTPS enforcement (only in production)
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),
          // Permissions Policy (restrict dangerous browser features)
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()',
              'fullscreen=(self)',
            ].join(', '),
          },
          // Cross-origin policies (for enhanced isolation)
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
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

  // Webpack configuration for native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize native Node.js modules and Node.js builtins for server-side builds
      config.externals = [
        ...(config.externals || []),
        '@node-rs/argon2',
        'node:crypto',
        'crypto',
      ]
    }
    return config
  },
}

export default nextConfig
