import type { PlayerProfile, RatingEvent } from "./types";
import { normalizeTeamName } from "./teams";

export const GAME_PAGE_SIZE = 20;

export type PageSlice<T> = {
  items: T[];
  current: number;
  pageCount: number;
  total: number;
};

export function parsePage(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function paginate<T>(items: T[], page: number, pageSize = GAME_PAGE_SIZE): PageSlice<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    current,
    pageCount,
    total,
  };
}

export function newestFirst<T>(items: T[]): T[] {
  return [...items].reverse();
}

export function gamesHref(basePath: string, page: number): string {
  const path = page <= 1 ? basePath : `${basePath}?page=${page}`;
  return `${path}#games`;
}

export type PageToken = { kind: "page"; page: number } | { kind: "ellipsis"; id: string };

export function pageTokens(current: number, pageCount: number, radius = 2): PageToken[] {
  if (pageCount < 1) return [];
  const wanted = new Set<number>([1, pageCount]);
  for (let page = current - radius; page <= current + radius; page++) {
    if (page >= 1 && page <= pageCount) wanted.add(page);
  }
  const sorted = [...wanted].sort((a, b) => a - b);
  const tokens: PageToken[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous > 0 && page - previous > 1) {
      if (page - previous === 2) {
        tokens.push({ kind: "page", page: previous + 1 });
      } else {
        tokens.push({ kind: "ellipsis", id: `${previous}-${page}` });
      }
    }
    tokens.push({ kind: "page", page });
    previous = page;
  }
  return tokens;
}

export function playersByGameId(players: PlayerProfile[]): Map<string, PlayerProfile[]> {
  const map = new Map<string, PlayerProfile[]>();
  for (const player of players) {
    const seen = new Set<string>();
    for (const event of player.history) {
      if (seen.has(event.gameId)) continue;
      seen.add(event.gameId);
      const list = map.get(event.gameId);
      if (list) list.push(player);
      else map.set(event.gameId, [player]);
    }
  }
  return map;
}

export function memberForTeamEvent(
  seated: PlayerProfile[] | undefined,
  teamName: string,
  event: RatingEvent,
): PlayerProfile | undefined {
  const wanted = normalizeTeamName(teamName) || teamName;
  const ranked = (seated ?? []).filter((player) => eventForGame(player, event.gameId)?.rank === event.rank);
  return (
    ranked.find((player) => {
      const seasonTeam = player.seasons.find((season) => season.season === event.season)?.team ?? player.team;
      return (normalizeTeamName(seasonTeam) || seasonTeam) === wanted || seasonTeam === teamName;
    }) ?? ranked[0]
  );
}

export function ratingBeforeByGame(
  players: PlayerProfile[],
  gameIds: Iterable<string>,
): Map<string, number> {
  const wanted = new Set(gameIds);
  const map = new Map<string, number>();
  for (const profile of players) {
    for (const event of profile.history) {
      if (!wanted.has(event.gameId)) continue;
      map.set(`${event.gameId}\0${profile.name}`, event.ratingBefore);
    }
  }
  return map;
}

export function eventForGame(player: PlayerProfile | undefined, gameId: string): RatingEvent | undefined {
  return player?.history.find((event) => event.gameId === gameId);
}
