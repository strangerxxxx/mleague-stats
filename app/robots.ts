import type { MetadataRoute } from "next";
import { pageUrl, SITE_URL } from "@/lib/mleague/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: pageUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
