import Link from "next/link";
import type { MatchDay } from "@/lib/mleague/matchDay";
import {
  formatDate,
  formatPoints,
  formatRating,
  formatSigned,
  pointsClass,
} from "@/lib/mleague/format";
import { Avatar } from "./Avatar";
import { TeamMark } from "./TeamMark";

export function LatestMatchDay({ day }: { day: MatchDay }) {
  return (
    <section id="recent" className="mb-12">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">直近の試合</h1>
        <p className="text-base text-[var(--muted)]">{formatDate(day.date)}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {day.matches.map((match, index) => {
          const table = match.tables[0];
          if (!table) return null;
          return (
            <div key={table.gameId}>
              <h3 className="mb-3 text-sm font-bold tracking-[0.12em] text-[var(--gold)]">
                #{match.matchNo}
              </h3>
              <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]">
                {table.seats.map((seat) => (
                  <div
                    key={`${table.gameId}-${seat.player}`}
                    className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-b-0"
                  >
                    <div className="person min-w-0">
                      <span
                        className={`rank-pill${seat.rank <= 3 ? ` is-${seat.rank}` : ""}`}
                      >
                        {seat.rank}
                      </span>
                      <Avatar
                        src={seat.photo}
                        name={seat.player}
                        size={36}
                        priority={index < 2}
                      />
                      <div className="min-w-0">
                        {seat.slug ? (
                          <Link
                            href={`/players/${seat.slug}`}
                            className="block truncate font-medium hover:text-[var(--gold)]"
                          >
                            {seat.player}
                          </Link>
                        ) : (
                          <div className="truncate font-medium">{seat.player}</div>
                        )}
                        <Link
                          href={`/teams/${seat.teamSlug}`}
                          className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--gold)]"
                        >
                          <TeamMark
                            src={seat.logo}
                            name={seat.team}
                            color={seat.color}
                            size={16}
                          />
                          <span className="truncate">{seat.team}</span>
                        </Link>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono text-sm">
                      <div className={pointsClass(seat.points)}>
                        {formatPoints(seat.points)}
                      </div>
                      <div className={pointsClass(seat.delta)}>
                        {formatSigned(seat.delta)}
                      </div>
                      <div className="text-[var(--gold-2)]">
                        {formatRating(seat.ratingAfter)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
