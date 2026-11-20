import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";
import { pageMetadata, seasonSeoDescription } from "@/lib/mleague/seo";
import { seasonLabel } from "@/lib/mleague/teams";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const snapshot = await getSiteSnapshot();
    return snapshot.seasons
      .filter((season) => season.id !== snapshot.latestSeason)
      .map((season) => ({ season: season.id }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/seasons/[season]">): Promise<Metadata> {
  const { season } = await params;
  return pageMetadata({
    title: `${seasonLabel(season)}のレーティング`,
    description: seasonSeoDescription(season),
    path: `/seasons/${season}`,
  });
}

export default async function SeasonHome({
  params,
}: PageProps<"/seasons/[season]">) {
  const { season } = await params;
  const snapshot = await getSiteSnapshot();
  if (!snapshot.playerRankings[season]) notFound();
  return <HomePage snapshot={snapshot} selected={season} />;
}
