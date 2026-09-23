import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";
import { CAREER_SCOPE } from "@/lib/mleague/types";

export const revalidate = 180;

export default async function CareerHome() {
  const snapshot = await getSiteSnapshot();
  return <HomePage snapshot={snapshot} selected={CAREER_SCOPE} />;
}
