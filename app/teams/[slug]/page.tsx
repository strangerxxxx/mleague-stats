import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RatingChart } from "@/components/RatingChart";
import { SeasonTable } from "@/components/SeasonTable";
import { StatGrid } from "@/components/StatGrid";
import { TeamMark } from "@/components/TeamMark";
import { getDataset } from "@/lib/mleague/dataset";
import { findTeam } from "@/lib/mleague/stats";
import { formatPoints, formatRating, pointsClass } from "@/lib/mleague/format";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps<"/teams/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDataset();
  const team = findTeam(dataset, slug);
  return {
    title: team ? `${team.name} のレーティング` : "チーム",
  };
}

export default async function TeamPage({ params }: PageProps<"/teams/[slug]">) {
  const { slug } = await params;
  const dataset = await getDataset();
  const team = findTeam(dataset, slug);
  if (!team) notFound();

  const latest = team.seasons.find((season) => season.season === dataset.latestSeason) ?? team.seasons.at(-1);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <Link href="/#teams" className="text-sm text-[var(--muted)] hover:text-[var(--gold)]">
        ← ランキングへ戻る
      </Link>
      <section className="mt-6 mb-8">
        <p className="text-sm tracking-[0.2em] text-[var(--gold)]">TEAM</p>
        <h1 className="mt-1 flex items-center gap-3 text-4xl font-bold">
          <TeamMark src={team.logo} name={team.name} color={team.color} size={48} />
          {team.name}
        </h1>
      </section>

      <StatGrid rating={team.rating} peakRating={team.peakRating} record={latest ?? team.career} />

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">今シーズンの選手</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {team.roster.map((player) => (
            <Link
              key={player.slug}
              href={`/players/${player.slug}`}
              className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4 hover:border-[var(--gold)]"
            >
              <Avatar src={player.photo} name={player.name} />
              <div>
                <div className="font-medium">{player.name}</div>
                <div className="font-mono text-sm text-[var(--gold-2)]">{formatRating(player.rating)}</div>
                <div className={`font-mono text-sm ${pointsClass(player.points)}`}>
                  {formatPoints(player.points)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">レーティング推移</h2>
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
          <RatingChart history={team.history} color={team.color} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">年度別・累計成績</h2>
        <SeasonTable seasons={team.seasons} career={team.career} />
      </section>
    </main>
  );
}
