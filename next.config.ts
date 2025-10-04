import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: false,
  },
  // In a future version of Next.js, the dev server will require this to be configured.
  // We are allowing all origins here for simplicity of the development environment.
  // In a real production scenario, you would want to lock this down to specific origins.
  experimental: {
    allowedDevOrigins: ['**'],
  },
};

export default nextConfig;
