/** @type {import('next').NextConfig} */
const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST;
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable persistent filesystem cache in tests to prevent corrupted pack errors
  webpack: (config) => {
    if (isTest || process.env.NEXT_DISABLE_FS_CACHE) {
      config.cache = false;
    }
    return config;
  },
}

export default nextConfig
