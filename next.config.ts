import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m-league.jp",
        pathname: "/wp/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
