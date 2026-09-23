import { notFound } from "next/navigation";
import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";

export const revalidate = 180;
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

export default async function SeasonHome({
  params,
}: {
  params: Promise<{ season: string }>;
}) {
  const { season } = await params;
  const snapshot = await getSiteSnapshot();
  if (!snapshot.playerRankings[season]) notFound();
  return <HomePage snapshot={snapshot} selected={season} />;
}
