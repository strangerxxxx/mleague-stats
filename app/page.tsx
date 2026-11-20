import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";
import { homeSeoDescription, pageMetadata, SITE_NAME } from "@/lib/mleague/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSiteSnapshot();
  return pageMetadata({
    title: { absolute: SITE_NAME },
    description: homeSeoDescription(snapshot.latestSeason),
    path: "/",
  });
}

export default async function Home() {
  const snapshot = await getSiteSnapshot();
  return <HomePage snapshot={snapshot} selected={snapshot.latestSeason} />;
}
