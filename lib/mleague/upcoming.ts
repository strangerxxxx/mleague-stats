import { getTeamMeta, teamSlug } from "./teams";
import type { MatchCard, RankingRow } from "./types";

export type UpcomingSeat = {
  name: string;
  shortName: string;
  slug: string;
  logo: string;
  color: string;
  rating?: number;
};

export type UpcomingTable = {
  id: string;
  desk: number;
  label: string;
  teams: UpcomingSeat[];
};

export type UpcomingMatchDay = {
  date: string;
  season: string;
  tables: UpcomingTable[];
};

export function deskLabel(desk: number, tableCount: number): string {
  if (tableCount < 2) return "対戦カード";
  if (desk === 0) return "白卓";
  if (desk === 1) return "黒卓";
  return `卓${desk + 1}`;
}

export function tokyoCalendarDate(now = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function nextUpcomingMatchDay(
  cards: MatchCard[],
  rankings: RankingRow[] = [],
  now = new Date(),
): UpcomingMatchDay | null {
  const today = tokyoCalendarDate(now);
  const upcoming = cards.filter((card) => card.date >= today);
  if (upcoming.length === 0) return null;
  const date = upcoming.reduce(
    (min, card) => (card.date < min ? card.date : min),
    upcoming[0].date,
  );
  const dayCards = upcoming
    .filter((card) => card.date === date)
    .sort((a, b) => a.desk - b.desk);
  const bySlug = new Map(rankings.map((row) => [row.slug, row]));
  return {
    date,
    season: dayCards[0]?.season ?? "",
    tables: dayCards.map((card) => ({
      id: card.id,
      desk: card.desk,
      label: deskLabel(card.desk, dayCards.length),
      teams: card.teams.map((team) => {
        const meta = getTeamMeta(team.name);
        const slug = meta?.slug ?? team.slug ?? teamSlug(team.name);
        const row = bySlug.get(slug);
        return {
          name: meta?.name ?? team.name,
          shortName: meta?.shortName ?? team.name,
          slug,
          logo: team.logo || row?.logo || "",
          color: meta?.color ?? row?.color ?? "#888",
          ...(row ? { rating: row.rating } : {}),
        };
      }),
    })),
  };
}
