import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { GameHistoryTable } from "@/components/GameHistoryTable";
import { JsonLd } from "@/components/JsonLd";
import { Pager } from "@/components/Pager";
import { RatingChart } from "@/components/RatingChart";
import { SeasonTable } from "@/components/SeasonTable";
import { StatGrid } from "@/components/StatGrid";
import { TeamMark } from "@/components/TeamMark";
import { getDataset } from "@/lib/mleague/dataset";
import { gamesHref, newestFirst, paginate, parsePage, ratingBeforeByGame } from "@/lib/mleague/history";
import { pageMetadata, playerJsonLd, playerSeoDescription } from "@/lib/mleague/seo";
import { findPlayer } from "@/lib/mleague/stats";
import { getTeamMeta } from "@/lib/mleague/teams";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: PageProps<"/players/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await getDataset();
  const player = findPlayer(dataset, slug);
  if (!player) {
    return { title: "選手" };
  }
  return pageMetadata({
    title: `${player.name} のレーティング`,
    description: playerSeoDescription(player),
    path: `/players/${player.slug}`,
    image: player.photo || undefined,
  });
}

export default async function PlayerPage({
  params,
  searchParams,
}: PageProps<"/players/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;
  const dataset = await getDataset();
  const player = findPlayer(dataset, slug);
  if (!player) notFound();

  const latest = player.seasons.find((season) => season.season === dataset.latestSeason) ?? player.seasons.at(-1);
  const team = getTeamMeta(player.team);
  const teamProfile = dataset.teams.find((item) => item.slug === player.teamSlug);
  const page = paginate(newestFirst(player.history), parsePage(query.page));
  const playerHref = new Map(dataset.players.map((item) => [item.name, item.slug]));
  const ratings = ratingBeforeByGame(
    dataset.players,
    page.items.map((event) => event.gameId),
  );
  const basePath = `/players/${player.slug}`;

  const description = playerSeoDescription(player);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      <JsonLd
        data={playerJsonLd({
          name: player.name,
          slug: player.slug,
          photo: player.photo,
          team: player.team,
          teamSlug: player.teamSlug,
          description,
        })}
      />
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

      <section id="games" className="mt-10 scroll-mt-24">
        <h2 className="mb-3 text-xl font-bold">対局結果</h2>
        <GameHistoryTable
          rows={page.items.map((event) => ({ event }))}
          playerHref={playerHref}
          ratingBeforeByGame={ratings}
        />
        <Pager
          current={page.current}
          pageCount={page.pageCount}
          total={page.total}
          hrefFor={(item) => gamesHref(basePath, item)}
        />
      </section>
    </main>
  );
}
