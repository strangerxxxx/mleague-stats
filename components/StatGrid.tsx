import { formatAvgRank, formatPoints, formatRating, formatSigned, pointsClass } from "@/lib/mleague/format";
import { INITIAL_RATING } from "@/lib/mleague/rating";
import type { SeasonRecord } from "@/lib/mleague/types";

export function StatGrid({
  rating,
  peakRating,
  record,
}: {
  rating: number;
  peakRating: number;
  record: SeasonRecord;
}) {
  const seasonDelta = record.isolatedRating - INITIAL_RATING;
  const items = [
    { label: "レーティング", value: formatRating(rating), className: "text-[var(--gold-2)]" },
    { label: "最高R", value: formatRating(peakRating), className: "text-[var(--ink)]" },
    { label: "今期収支", value: formatPoints(record.points), className: pointsClass(record.points) },
    { label: "今季R変動", value: formatSigned(seasonDelta), className: pointsClass(seasonDelta) },
    { label: "試合数", value: String(record.games), className: "text-[var(--ink)]" },
    { label: "平均着順", value: formatAvgRank(record.avgRank), className: "text-[var(--ink)]" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)] p-4">
          <div className="text-xs tracking-widest text-[var(--muted)]">{item.label}</div>
          <div className={`mt-2 font-mono text-2xl font-semibold ${item.className}`}>{item.value}</div>
        </div>
      ))}
    </div>
  );
}
