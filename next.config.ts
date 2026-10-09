import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ['date-fns', 'clsx'],
  },
};

export default nextConfig;
