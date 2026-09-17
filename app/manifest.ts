import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mリーグ レーティング",
    short_name: "M.STATS",
    description:
      "Mリーグの試合結果から個人・チームの成績とレーティングを集計した非公式サイトです。",
    start_url: "/",
    display: "standalone",
    background_color: "#07080d",
    theme_color: "#00632f",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
