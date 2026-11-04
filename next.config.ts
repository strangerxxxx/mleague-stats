import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    GAMES_DATA_URL:
      process.env.GAMES_DATA_URL ||
      "https://mleague-stats-data-471112833056.s3.ap-northeast-1.amazonaws.com/data/games.json",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m-league.jp",
        pathname: "/wp/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "m-league.jp",
        pathname: "/assets/**",
      },
    ],
  },
};

export default nextConfig;
