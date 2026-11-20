import type { MetadataRoute } from "next";
import { getSiteSnapshot } from "@/lib/mleague/dataset";
import { pageUrl } from "@/lib/mleague/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const snapshot = await getSiteSnapshot();
  const lastModified = snapshot.fetchedAt;
  const seasons = snapshot.seasons.filter((season) => season.id !== snapshot.latestSeason);

  return [
    { url: pageUrl("/"), lastModified, changeFrequency: "hourly", priority: 1 },
    { url: pageUrl("/career"), lastModified, changeFrequency: "daily", priority: 0.8 },
    ...seasons.map((season) => ({
      url: pageUrl(`/seasons/${season.id}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...snapshot.searchItems.map((item) => ({
      url: pageUrl(item.href),
      lastModified,
      changeFrequency: "hourly" as const,
      priority: item.kind === "team" ? 0.8 : 0.7,
    })),
  ];
}
