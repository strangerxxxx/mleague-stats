import { CAREER_SCOPE, type Dataset, type Game, type Rank } from "./types";
import { getTeamMeta, teamSlug } from "./teams";
import { sortGames } from "./rating";

export type MatchDaySeat = {
  rank: Rank;
  player: string;
  slug: string;
  photo: string;
  team: string;
  teamSlug: string;
  logo: string;
  color: string;
  points: number;
  delta: number;
  ratingBefore?: number;
  ratingAfter: number;
};

export type MatchDayTable = {
  gameId: string;
  round: number;
  seats: MatchDaySeat[];
  averageRatingBefore?: number;
};

export type MatchDayMatch = {
  matchNo: number;
  tables: MatchDayTable[];
};

export type MatchDay = {
  date: string;
  season: string;
  matches: MatchDayMatch[];
};

export function tableAverageRating(
  ratings: Array<number | null | undefined>,
): number | null {
  if (ratings.length === 0) return null;
  let sum = 0;
  for (const rating of ratings) {
    if (typeof rating !== "number" || !Number.isFinite(rating)) return null;
    sum += rating;
  }
  return sum / ratings.length;
}

export function prematchSeatRating(seat: MatchDaySeat): number {
  return seat.ratingBefore ?? seat.ratingAfter - seat.delta;
}

export function prematchTableAverage(
  table: Pick<MatchDayTable, "seats">,
): number | null {
  return tableAverageRating(table.seats.map(prematchSeatRating));
}

export function matchNumberByGameId(games: Game[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const game of games) {
    map.set(game.id, game.round > 0 ? game.round : 1);
  }
  return map;
}

export function latestMatchDay(dataset: Dataset, seasonId: string): MatchDay | null {
  const scoped =
    seasonId === CAREER_SCOPE
      ? dataset.games
      : dataset.games.filter((game) => game.season === seasonId);
  if (scoped.length === 0) return null;
  const latest = scoped.reduce(
    (max, game) => (game.date > max ? game.date : max),
    scoped[0].date,
  );
  const dayGames = sortGames(scoped.filter((game) => game.date === latest));
  if (dayGames.length === 0) return null;

  const matchNos = matchNumberByGameId(dayGames);
  const players = new Map(dataset.players.map((player) => [player.name, player]));

  return {
    date: latest,
    season: dayGames[0].season,
    matches: dayGames.map((game) => {
      const seats = game.results
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .map((result) => {
          const player = players.get(result.player);
          const event = player?.history.find((item) => item.gameId === game.id);
          const isolated = seasonId !== CAREER_SCOPE;
          const meta = getTeamMeta(result.team);
          const delta = isolated ? (event?.isolatedDelta ?? 0) : (event?.delta ?? 0);
          const after = isolated
            ? (event?.isolatedAfter ?? player?.rating ?? 1500)
            : (event?.ratingAfter ?? player?.rating ?? 1500);
          return {
            rank: result.rank,
            player: result.player,
            slug: player?.slug ?? "",
            photo: result.photo || player?.photo || "",
            team: result.team,
            teamSlug: meta?.slug ?? teamSlug(result.team),
            logo: result.teamLogo || player?.seasons.at(-1)?.logo || "",
            color: meta?.color ?? "#888",
            points: result.points,
            delta,
            ratingBefore: isolated
              ? (event?.isolatedAfter ?? after) - delta
              : (event?.ratingBefore ?? after - delta),
            ratingAfter: after,
          };
        });
      const averageRatingBefore = prematchTableAverage({ seats });
      const table = {
        gameId: game.id,
        round: game.round,
        seats,
        ...(averageRatingBefore == null ? {} : { averageRatingBefore }),
      };
      return {
        matchNo: matchNos.get(game.id) ?? 1,
        tables: [table],
      };
    }),
  };
}
