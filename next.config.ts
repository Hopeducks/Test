import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Static export requires this to bypass Next.js image optimization server
  },
  reactStrictMode: true,
};

export default nextConfig;
