/** @type {import('next').NextConfig} */

// Derive allowed server-action origins from NEXT_PUBLIC_ALLOWED_HOSTS env var.
// In production set: NEXT_PUBLIC_ALLOWED_HOSTS=omanye.io,www.omanye.io
const extraHosts = process.env.NEXT_PUBLIC_ALLOWED_HOSTS
  ? process.env.NEXT_PUBLIC_ALLOWED_HOSTS.split(',').map(h => h.trim())
  : []

const nextConfig = {
  // Disabled to prevent Supabase gotrue-js auth lock contention warning in dev.
  // React Strict Mode double-fires effects which causes the auth token lock to
  // be held across the first unmount, triggering a 5000ms timeout warning.
  // This setting has no effect on production builds.
  reactStrictMode: false,

  experimental: {
    serverActions: {
      allowedOrigins: [
        ...extraHosts,
        '*.vercel.app',
        '*.app.github.dev',
        'localhost:3000',
        'localhost:3001',
      ],
    },
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Silence noisy peer-dep warnings from @react-pdf/renderer
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
