/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Disable ESLint errors from failing the build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors from failing the build
  typescript: {
    ignoreBuildErrors: true,
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000',
  },
};

module.exports = nextConfig;