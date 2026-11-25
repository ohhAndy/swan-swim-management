import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@school/shared-types"],
};

export default nextConfig;
