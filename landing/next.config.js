/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ncqjqrkusaujjcednzuk.supabase.co',
        port: '',
        pathname: '/storage/v1/**',
      },
    ],
  },
}

module.exports = nextConfig
