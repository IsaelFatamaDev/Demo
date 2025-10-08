import type { NextConfig } from 'next';

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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Disable Node.js modules for client-side bundling
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Node.js core modules that don't work in the browser
        async_hooks: false,
        child_process: false,
        dgram: false,
        dns: false,
        fs: false,
        'fs/promises': false,
        http2: false,
        net: false,
        tls: false,
        zlib: false,
        // Node.js specific modules
        'node:fs': false,
        'node:net': false,
        'node:crypto': false,
        'node:path': false,
        'node:stream': false,
        'node:util': false,
        'node:os': false,
        'node:url': false,
        'node:http': false,
        'node:https': false,
        'node:buffer': false,
        'node:events': false,
        'node:assert': false,
        'node:querystring': false,
        'node:zlib': false,
      };

      // Ignore specific problematic modules
      config.externals = config.externals || [];
      config.externals.push({
        'node:fs': 'commonjs node:fs',
        'node:net': 'commonjs node:net',
      });
    }
    return config;
  },
};

export default nextConfig;
