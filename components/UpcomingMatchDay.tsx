import Link from "next/link";
import { formatDateWithWeekday, formatRating } from "@/lib/mleague/format";
import type { UpcomingMatchDay as UpcomingMatchDayData } from "@/lib/mleague/upcoming";
import { TeamMark } from "./TeamMark";

export function UpcomingMatchDay({ day }: { day: UpcomingMatchDayData }) {
  return (
    <section id="upcoming" className="mb-12">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">次回の対戦カード</h2>
        <p className="text-base text-[var(--muted)]">{formatDateWithWeekday(day.date)}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {day.tables.map((table) => (
          <div key={table.id}>
            <h3 className="mb-3 text-sm font-bold tracking-[0.12em] text-[var(--gold)]">
              {table.label}
            </h3>
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-elev)]">
              {table.teams.map((team) => (
                <Link
                  key={`${table.id}-${team.slug}`}
                  href={`/teams/${team.slug}`}
                  className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 hover:bg-white/[0.03]"
                >
                  <span className="person min-w-0">
                    <TeamMark src={team.logo} name={team.name} color={team.color} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{team.name}</span>
                      {team.shortName !== team.name ? (
                        <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                          {team.shortName}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  {team.rating != null ? (
                    <span className="shrink-0 font-mono text-sm text-[var(--gold-2)]">
                      {formatRating(team.rating)}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
