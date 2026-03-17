/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'omanye.io',
        'www.omanye.io',
        '*.vercel.app',
        '*.app.github.dev',
        'localhost:3000',
        'localhost:3001',
      ],
    },
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

  // @react-pdf/renderer is ESM-only — exclude from Next.js bundling
  serverExternalPackages: ['@react-pdf/renderer'],

  // Silence noisy peer-dep warnings from @react-pdf/renderer
  webpack: (config) => {
    config.resolve.alias.canvas = false
    return config
  },
}

export default nextConfig
