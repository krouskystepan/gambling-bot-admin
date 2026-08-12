import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['gambling-bot-shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/icons/**'
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/avatars/**'
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**'
      }
    ]
  }
}

export default nextConfig
