/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Allow production builds to successfully complete even if the project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to successfully complete even if there are type errors.
    ignoreBuildErrors: true,
  },
  env: {
    VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:5001',
    VITE_SOCKET_URL: process.env.VITE_SOCKET_URL || 'http://localhost:5001',
  }
}

export default nextConfig
