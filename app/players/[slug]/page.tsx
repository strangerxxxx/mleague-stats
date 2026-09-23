import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { RatingChart } from "@/components/RatingChart";
import { SeasonTable } from "@/components/SeasonTable";
import { StatGrid } from "@/components/StatGrid";
import { TeamMark } from "@/components/TeamMark";
import { getDataset } from "@/lib/mleague/dataset";
import { findPlayer } from "@/lib/mleague/stats";
import { formatGameStamp, formatPoints, formatRating, formatSigned, pointsClass } from "@/lib/mleague/format";
import { getTeamMeta } from "@/lib/mleague/teams";

export const dynamicParams = true;
export const revalidate = 180;

export async function generateMetadata({
  params,
}: PageProps<"/players/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDataset();
  const player = findPlayer(dataset, slug);
  return {
    title: player ? `${player.name} のレーティング` : "選手",
  };
}

export default async function PlayerPage({ params }: PageProps<"/players/[slug]">) {
  const { slug } = await params;
  const dataset = await getDataset();
  const player = findPlayer(dataset, slug);
  if (!player) notFound();

  const latest = player.seasons.find((season) => season.season === dataset.latestSeason) ?? player.seasons.at(-1);
  const team = getTeamMeta(player.team);
  const teamProfile = dataset.teams.find((item) => item.slug === player.teamSlug);
  const recent = [...player.history].reverse().slice(0, 12);
  const playerHref = new Map(dataset.players.map((item) => [item.name, item.slug]));

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <Link href="/" className="text-sm text-[var(--muted)] hover:text-[var(--gold)]">
        ← ランキングへ戻る
      </Link>
      <section className="mt-6 mb-8 flex flex-wrap items-center gap-5">
        <Avatar src={player.photo} name={player.name} size={84} />
        <div>
          <p className="text-sm tracking-[0.2em] text-[var(--gold)]">PLAYER</p>
          <h1 className="text-4xl font-bold">{player.name}</h1>
          {team ? (
            <Link href={`/teams/${team.slug}`} className="mt-2 inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--gold)]">
              <TeamMark src={teamProfile?.logo} name={player.team} color={team.color} size={28} />
              {player.team}
            </Link>
          ) : null}
        </div>
      </section>

      <StatGrid rating={player.rating} peakRating={player.peakRating} record={latest ?? player.career} />

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">レーティング推移</h2>
        <div className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
          <RatingChart history={player.history} color={team?.color} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">年度別・累計成績</h2>
        <SeasonTable seasons={player.seasons} career={player.career} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-xl font-bold">最近の試合</h2>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>日付</th>
                <th>着順</th>
                <th>収支</th>
                <th>R変動</th>
                <th>対戦</th>
                <th>R</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((event) => (
                <tr key={`${event.gameId}-${event.date}-${event.rank}`}>
                  <td>{formatGameStamp(event.date, event.round > 0 ? event.round : 1)}</td>
                  <td>{event.rank}着</td>
                  <td className={pointsClass(event.points)}>{formatPoints(event.points)}</td>
                  <td className={pointsClass(event.delta)}>{formatSigned(event.delta)}</td>
                  <td>
                    {event.opponents.map((name, index) => {
                      const slug = playerHref.get(name);
                      return (
                        <span key={`${event.gameId}-${name}`}>
                          {index > 0 ? " / " : null}
                          {slug ? (
                            <Link
                              href={`/players/${slug}`}
                              className="underline decoration-[var(--line)] underline-offset-2 hover:text-[var(--gold)] hover:decoration-[var(--gold)]"
                            >
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                        </span>
                      );
                    })}
                  </td>
                  <td className="font-mono text-[var(--gold-2)]">{formatRating(event.ratingAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
