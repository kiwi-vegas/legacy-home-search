import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Prevent large community photo assets from being bundled into serverless functions.
  // These are served as static CDN assets and don't need to be in function bundles.
  outputFileTracingExcludes: {
    '*': ['./public/community-photos/**/*', './public/*.png', './public/*.jpg'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
}

export default nextConfig
