import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cloudflare tunnel and local network origins in development
  allowedDevOrigins: [
    'trycloudflare.com',
    'loca.lt',
  ],
};

export default nextConfig;
