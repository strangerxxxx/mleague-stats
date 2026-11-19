import type { Game, Rank } from "./types";

export const INITIAL_RATING = 1500;
export const GAME_COUNT_FACTOR = 0.5;
export const SCALING_FACTOR = 1.0;
export const TABLE_CORRECTION_DIVISOR = 40;

export const RANK_POINT_VALUES = [45, 5, -15, -35] as const;

export function rankPoints(rank: Rank): number {
  return RANK_POINT_VALUES[rank - 1] ?? 0;
}

export function sharedRankPoints(ranks: Rank[], points?: number[]): number[] {
  const n = ranks.length;
  const order = Array.from({ length: n }, (_, index) => index).sort((a, b) => {
    if (points) {
      const diff = points[b] - points[a];
      if (diff !== 0) return diff;
    }
    return ranks[a] - ranks[b];
  });

  const result = Array.from({ length: n }, () => 0);
  let i = 0;
  while (i < n) {
    const start = i;
    const head = order[i];
    i += 1;
    while (i < n) {
      const current = order[i];
      const tied = points
        ? Math.round(points[current] * 10) === Math.round(points[head] * 10)
        : ranks[current] === ranks[head];
      if (!tied) break;
      i += 1;
    }
    let sum = 0;
    for (let place = start; place < i; place++) {
      sum += RANK_POINT_VALUES[place] ?? 0;
    }
    const share = sum / (i - start);
    for (let index = start; index < i; index++) {
      result[order[index]] = share;
    }
  }
  return result;
}

export function ratingDelta(args: {
  ownRating: number;
  tableAverage: number;
  rank?: Rank;
  resultPoints?: number;
}): number {
  const correction =
    (args.tableAverage - args.ownRating) / TABLE_CORRECTION_DIVISOR;
  const result =
    (args.resultPoints ?? (args.rank != null ? rankPoints(args.rank) : 0)) + correction;
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
  points?: number[],
): { next: Map<T, number>; deltas: number[] } {
  const tableAverage =
    keys.reduce((sum, key) => sum + (ratings.get(key) ?? INITIAL_RATING), 0) /
    keys.length;
  const resultPoints = sharedRankPoints(ranks, points);
  const next = new Map(ratings);
  const deltas: number[] = [];
  keys.forEach((key, index) => {
    const own = ratings.get(key) ?? INITIAL_RATING;
    const delta = ratingDelta({
      ownRating: own,
      tableAverage,
      resultPoints: resultPoints[index],
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
