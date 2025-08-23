/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration for Base App deployment
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
};

module.exports = nextConfig;
