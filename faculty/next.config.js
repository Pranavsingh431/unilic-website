/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@unilic/shared'],
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
