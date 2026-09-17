import type { SeasonRecord } from "@/lib/mleague/types";
import { INITIAL_RATING } from "@/lib/mleague/rating";
import {
  formatAvgRank,
  formatPercent,
  formatPoints,
  formatRating,
  formatSigned,
  pointsClass,
} from "@/lib/mleague/format";
import { TeamMark } from "./TeamMark";

export function SeasonTable({
  seasons,
  career,
}: {
  seasons: SeasonRecord[];
  career: SeasonRecord;
}) {
  const rows = [...seasons].reverse();
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>シーズン</th>
            <th>所属</th>
            <th>最終R</th>
            <th>R変動</th>
            <th>収支</th>
            <th>試合</th>
            <th>平均着順</th>
            <th>1着率</th>
            <th>連対率</th>
            <th>着順</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <SeasonRow key={row.season} row={row} label={row.season} />
          ))}
          <SeasonRow row={career} label="累計" strong />
        </tbody>
      </table>
    </div>
  );
}

function SeasonRow({
  row,
  label,
  strong = false,
}: {
  row: SeasonRecord;
  label: string;
  strong?: boolean;
}) {
  const games = row.games;
  const topRate = games ? row.rankCounts[0] / games : 0;
  const rentaiRate = games ? (row.rankCounts[0] + row.rankCounts[1]) / games : 0;
  return (
    <tr className={strong ? "bg-white/[0.03] font-semibold" : undefined}>
      <td>{label}</td>
      <td>
        {row.team ? (
          <span className="person">
            <TeamMark src={row.logo} name={row.team} size={24} />
            {row.team}
          </span>
        ) : (
          "-"
        )}
      </td>
      <td className="font-mono text-[var(--gold-2)]">
        {formatRating(strong ? row.ratingEnd : row.isolatedRating)}
      </td>
      <td
        className={pointsClass(
          strong ? row.ratingEnd - row.ratingStart : row.isolatedRating - INITIAL_RATING,
        )}
      >
        {formatSigned(strong ? row.ratingEnd - row.ratingStart : row.isolatedRating - INITIAL_RATING)}
      </td>
      <td className={pointsClass(row.points)}>{formatPoints(row.points)}</td>
      <td>{row.games}</td>
      <td>{formatAvgRank(row.avgRank)}</td>
      <td>{formatPercent(topRate)}</td>
      <td>{formatPercent(rentaiRate)}</td>
      <td className="text-[var(--muted)]">{row.rankCounts.join("-")}</td>
    </tr>
  );
}
