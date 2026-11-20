import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";
import { getSiteSnapshot } from "@/lib/mleague/dataset";
import { careerSeoDescription, pageMetadata } from "@/lib/mleague/seo";
import { CAREER_SCOPE } from "@/lib/mleague/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "通算レーティング",
    description: careerSeoDescription(),
    path: "/career",
  });
}

export default async function CareerHome() {
  const snapshot = await getSiteSnapshot();
  return <HomePage snapshot={snapshot} selected={CAREER_SCOPE} />;
}
