import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained server build for the Docker image (see Dockerfile).
  output: 'standalone',
};

export default nextConfig;
