/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // Workbox PWA configuration
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      const { GenerateSW } = require('workbox-webpack-plugin');
      
      config.plugins.push(
        new GenerateSW({
          swDest: 'sw.js',
          clientsClaim: true,
          skipWaiting: true,
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
