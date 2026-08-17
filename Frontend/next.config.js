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
    VITE_API_URL: (() => {
      let url = process.env.VITE_API_URL || 'http://localhost:5001'
      if (url.endsWith('/')) url = url.slice(0, -1)
      if (url.endsWith('/api')) url = url.slice(0, -4)
      return url
    })(),
    VITE_SOCKET_URL: (() => {
      let url = process.env.VITE_SOCKET_URL || 'http://localhost:5001'
      if (url.endsWith('/')) url = url.slice(0, -1)
      if (url.endsWith('/api')) url = url.slice(0, -4)
      return url
    })(),
  }
}

export default nextConfig
