import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // We configure explicit linting checks in Phase 0
    dirs: ["app", "components", "features", "lib"],
  },
};

export default nextConfig;
