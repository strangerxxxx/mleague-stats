import { RankingTable } from "@/components/RankingTable";
import { SearchBox } from "@/components/SearchBox";
import { SeasonSwitcher } from "@/components/SeasonSwitcher";
import { LatestMatchDay } from "@/components/LatestMatchDay";
import type { SiteSnapshot } from "@/lib/mleague/site";

export function HomePage({
  snapshot,
  selected,
}: {
  snapshot: SiteSnapshot;
  selected: string;
}) {
  const playerRows = snapshot.playerRankings[selected] ?? [];
  const teamRows = snapshot.teamRankings[selected] ?? [];
  const recentDay = snapshot.latestMatchDays[selected] ?? null;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10">
      {recentDay ? (
        <LatestMatchDay day={recentDay} />
      ) : (
        <h1 className="mb-10 text-3xl font-bold tracking-tight sm:text-4xl">
          Mリーグ レーティング
        </h1>
      )}

      <section className="mb-10 space-y-4">
        <SearchBox items={snapshot.searchItems} />
        <SeasonSwitcher
          seasons={snapshot.seasons.map((season) => season.id)}
          latestSeason={snapshot.latestSeason}
          selected={selected}
        />
      </section>

      <section id="players" className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">個人レーティング</h2>
          </div>
          <span className="text-sm text-[var(--muted)]">{playerRows.length}名</span>
        </div>
        <RankingTable rows={playerRows} kind="player" />
      </section>

      <section id="teams" className="mb-12">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">チームレーティング</h2>
          </div>
        </div>
        <RankingTable rows={teamRows} kind="team" />
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-[var(--bg-elev)] p-6 text-sm leading-7 text-[var(--muted)]">
        <h2 className="mb-2 text-base font-bold text-[var(--ink)]">レーティング計算式</h2>
        <p>初期値 = R1500</p>
        <p>(Rateの変動) = 0.5 × (対戦結果 + 補正値)</p>
        <ul className="mt-3 list-disc pl-5">
          <li>対戦結果: 1位 +45 / 2位 +5 / 3位 -15 / 4位 -35</li>
          <li>補正値: (卓の平均R - 自分のR) / 40</li>
        </ul>
      </section>
    </main>
  );
}
