import type { Game, Rank } from "./types";

export const INITIAL_RATING = 1500;
export const GAME_COUNT_FACTOR = 0.5;
export const SCALING_FACTOR = 1.0;
export const TABLE_CORRECTION_DIVISOR = 40;

const RANK_POINTS: Record<Rank, number> = {
  1: 45,
  2: 5,
  3: -15,
  4: -35,
};

export function rankPoints(rank: Rank): number {
  return RANK_POINTS[rank] ?? 0;
}

export function ratingDelta(args: {
  ownRating: number;
  tableAverage: number;
  rank: Rank;
}): number {
  const correction =
    (args.tableAverage - args.ownRating) / TABLE_CORRECTION_DIVISOR;
  const result = rankPoints(args.rank) + correction;
  return GAME_COUNT_FACTOR * result * SCALING_FACTOR;
}

export type RatedEntity = {
  rating: number;
  events: {
    gameId: string;
    date: string;
    season: string;
    rank: Rank;
    points: number;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
    opponents: string[];
    team: string;
  }[];
};

export function applyGameRatings<T extends string>(
  ratings: Map<T, number>,
  keys: T[],
  ranks: Rank[],
): { next: Map<T, number>; deltas: number[] } {
  const tableAverage =
    keys.reduce((sum, key) => sum + (ratings.get(key) ?? INITIAL_RATING), 0) /
    keys.length;
  const next = new Map(ratings);
  const deltas: number[] = [];
  keys.forEach((key, index) => {
    const own = ratings.get(key) ?? INITIAL_RATING;
    const delta = ratingDelta({
      ownRating: own,
      tableAverage,
      rank: ranks[index],
    });
    deltas.push(delta);
    next.set(key, own + delta);
  });
  return { next, deltas };
}

export function sortGames(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.session !== b.session) return a.session - b.session;
    return a.round - b.round;
  });
}
