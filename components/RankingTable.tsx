import Link from "next/link";
import type { RankingRow } from "@/lib/mleague/types";
import {
  formatAvgRank,
  formatPercent,
  formatPoints,
  formatRating,
  pointsClass,
} from "@/lib/mleague/format";
import { Avatar } from "./Avatar";
import { TeamMark } from "./TeamMark";

export function RankingTable({
  rows,
  kind,
}: {
  rows: RankingRow[];
  kind: "player" | "team";
}) {
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>順位</th>
            <th>{kind === "player" ? "選手" : "チーム"}</th>
            {kind === "player" ? <th>チーム</th> : null}
            <th>R</th>
            <th>収支</th>
            <th>試合</th>
            <th>平均着順</th>
            <th>1着率</th>
            <th>連対率</th>
            <th>着順</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = kind === "player" ? `/players/${row.slug}` : `/teams/${row.slug}`;
            return (
              <tr key={row.slug}>
                <td>
                  <span className={`rank-pill${row.rank <= 3 ? ` is-${row.rank}` : ""}`}>
                    {row.rank}
                  </span>
                </td>
                <td>
                  <Link href={href} className="person hover:text-[var(--gold)]">
                    {kind === "player" ? (
                      <Avatar src={row.photo} name={row.name} />
                    ) : (
                      <TeamMark src={row.logo} name={row.name} color={row.color} size={40} />
                    )}
                    <span className="font-medium">{row.name}</span>
                  </Link>
                </td>
                {kind === "player" ? (
                  <td>
                    <Link href={`/teams/${row.teamSlug}`} className="person hover:text-[var(--gold)]">
                      <TeamMark src={row.logo} name={row.team} color={row.color} size={28} />
                      {row.team}
                    </Link>
                  </td>
                ) : null}
                <td className="font-mono font-semibold text-[var(--gold-2)]">
                  {formatRating(row.rating)}
                </td>
                <td className={pointsClass(row.points)}>{formatPoints(row.points)}</td>
                <td>{row.games}</td>
                <td>{formatAvgRank(row.avgRank)}</td>
                <td>{formatPercent(row.topRate)}</td>
                <td>{formatPercent(row.rentaiRate)}</td>
                <td className="text-[var(--muted)]">
                  {row.rankCounts.join("-")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
