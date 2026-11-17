import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "freight.cargo.site",
      },
      {
        protocol: "https",
        hostname: "patentimages.storage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/work", destination: "/", permanent: true },
      { source: "/portfolio", destination: "/#products", permanent: true },
      { source: "/software", destination: "/#ai-tools", permanent: true },
    ];
  },
};

export default nextConfig;
