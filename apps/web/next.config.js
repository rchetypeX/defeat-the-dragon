

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for Base App deployment
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  
  // Farcaster Mini App redirect to hosted manifest
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: process.env.FARCASTER_HOSTED_MANIFEST_URL || 'https://api.farcaster.xyz/miniapps/hosted-manifest/019909b5-42c7-b640-de5b-7f959976e7ea',
        permanent: false,
      },
    ];
  },
  
  // Add cache busting for static assets
  async headers() {
    return [
      {
        // Apply cache busting headers to all static assets
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Apply cache busting headers to specific image types
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
