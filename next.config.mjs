/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        'sturdy-engine-r495455jjpr4f5qvx-3000.app.github.dev',
        'localhost:3000',
        'localhost:3001',
      ],
    },
  },
}

export default nextConfig
