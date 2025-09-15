import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  allowedDevOrigins: ["b0a1e5694d63.ngrok-free.app*", "gotham.deeptrack.io*"],
};

export default nextConfig;
