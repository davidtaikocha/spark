import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
};

export default nextConfig;
