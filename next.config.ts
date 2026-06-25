import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Catch type errors at build time to prevent production failures
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
