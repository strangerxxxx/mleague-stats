import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";

export const dynamic = "force-dynamic";

export default async function Home() {
  const snapshot = await getSiteSnapshot();
  return <HomePage snapshot={snapshot} selected={snapshot.latestSeason} />;
}
