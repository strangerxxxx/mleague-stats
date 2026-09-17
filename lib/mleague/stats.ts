import type {
  Dataset,
  Game,
  PlayerProfile,
  RankingRow,
  SeasonRecord,
  TeamProfile,
} from "./types";
import { CAREER_SCOPE } from "./types";
import {
  INITIAL_RATING,
  applyGameRatings,
  sortGames,
} from "./rating";
import {
  TEAMS,
  getTeamMeta,
  normalizeTeamName,
  slugify,
  teamSlug,
} from "./teams";
import type { CachedGames } from "./fetch";
import { roundTo } from "./format";

type EntityState = {
  rating: number;
  isolatedRating: number;
  isolatedSeason: string;
  peak: number;
  points: number;
  games: number;
  rankCounts: [number, number, number, number];
  photo: string;
  logo: string;
  team: string;
  name: string;
  history: PlayerProfile["history"];
  seasons: Map<string, SeasonBucket>;
};

type SeasonBucket = {
  season: string;
  games: number;
  points: number;
  rankCounts: [number, number, number, number];
  ratingStart: number;
  ratingEnd: number;
  peakRating: number;
  isolatedRating: number;
  team: string;
  logo: string;
};

function emptyCounts(): [number, number, number, number] {
  return [0, 0, 0, 0];
}

function createEntity(name: string): EntityState {
  return {
    rating: INITIAL_RATING,
    isolatedRating: INITIAL_RATING,
    isolatedSeason: "",
    peak: INITIAL_RATING,
    points: 0,
    games: 0,
    rankCounts: emptyCounts(),
    photo: "",
    logo: "",
    team: "",
    name,
    history: [],
    seasons: new Map(),
  };
}

function prepareSeason(entity: EntityState, season: string, team: string): SeasonBucket {
  if (entity.isolatedSeason !== season) {
    entity.isolatedRating = INITIAL_RATING;
    entity.isolatedSeason = season;
  }
  return ensureSeason(entity, season, team);
}

function ensureSeason(entity: EntityState, season: string, team: string): SeasonBucket {
  const existing = entity.seasons.get(season);
  if (existing) {
    if (team) existing.team = team;
    return existing;
  }
  const bucket: SeasonBucket = {
    season,
    games: 0,
    points: 0,
    rankCounts: emptyCounts(),
    ratingStart: entity.rating,
    ratingEnd: entity.rating,
    peakRating: entity.rating,
    isolatedRating: INITIAL_RATING,
    team,
    logo: "",
  };
  entity.seasons.set(season, bucket);
  return bucket;
}

function applyResult(
  entity: EntityState,
  args: {
    gameId: string;
    date: string;
    season: string;
    rank: 1 | 2 | 3 | 4;
    points: number;
    delta: number;
    isolatedDelta: number;
    opponents: string[];
    team: string;
    photo?: string;
    logo?: string;
  },
) {
  const before = entity.rating;
  const season = ensureSeason(entity, args.season, args.team);
  const after = before + args.delta;
  entity.rating = after;
  entity.isolatedRating += args.isolatedDelta;
  entity.peak = Math.max(entity.peak, after);
  entity.points += args.points;
  entity.games += 1;
  entity.rankCounts[args.rank - 1] += 1;
  entity.team = args.team || entity.team;
  if (args.photo) entity.photo = args.photo;
  if (args.logo) {
    entity.logo = args.logo;
    season.logo = args.logo;
  }
  entity.history.push({
    gameId: args.gameId,
    date: args.date,
    season: args.season,
    rank: args.rank,
    points: args.points,
    ratingBefore: before,
    ratingAfter: after,
    delta: args.delta,
    opponents: args.opponents,
  });
  season.games += 1;
  season.points += args.points;
  season.rankCounts[args.rank - 1] += 1;
  season.ratingEnd = after;
  season.peakRating = Math.max(season.peakRating, after);
  season.isolatedRating = entity.isolatedRating;
  if (args.team) season.team = args.team;
}

function toSeasonRecord(bucket: SeasonBucket): SeasonRecord {
  return {
    season: bucket.season,
    games: bucket.games,
    points: bucket.points,
    rankCounts: bucket.rankCounts,
    avgRank: averageRank(bucket.rankCounts, bucket.games),
    ratingStart: bucket.ratingStart,
    ratingEnd: bucket.ratingEnd,
    peakRating: bucket.peakRating,
    isolatedRating: bucket.isolatedRating,
    team: bucket.team,
    logo: bucket.logo,
  };
}

function careerFrom(entity: EntityState): SeasonRecord {
  return {
    season: "career",
    games: entity.games,
    points: entity.points,
    rankCounts: entity.rankCounts,
    avgRank: averageRank(entity.rankCounts, entity.games),
    ratingStart: INITIAL_RATING,
    ratingEnd: entity.rating,
    peakRating: entity.peak,
    isolatedRating: entity.rating,
    team: entity.team,
    logo: entity.logo,
  };
}

function averageRank(counts: [number, number, number, number], games: number): number {
  if (games === 0) return 0;
  return (
    (counts[0] * 1 + counts[1] * 2 + counts[2] * 3 + counts[3] * 4) / games
  );
}

function teamKey(name: string): string {
  return normalizeTeamName(name) || name;
}

export function buildDataset(cache: CachedGames): Dataset {
  const games = sortGames(cache.games);
  const players = new Map<string, EntityState>();
  const teams = new Map<string, EntityState>();

  for (const game of games) {
    if (game.results.length !== 4) continue;
    const playerKeys = game.results.map((result) => result.player);
    const teamKeys = game.results.map((result) => teamKey(result.team)).filter(Boolean);
    for (const result of game.results) {
      if (!players.has(result.player)) players.set(result.player, createEntity(result.player));
      if (result.team) {
        const key = teamKey(result.team);
        if (!teams.has(key)) teams.set(key, createEntity(key));
      }
    }

    for (const result of game.results) {
      prepareSeason(players.get(result.player)!, game.season, result.team);
      if (result.team) prepareSeason(teams.get(teamKey(result.team))!, game.season, result.team);
    }

    const playerRatings = new Map(
      playerKeys.map((key) => [key, players.get(key)?.rating ?? INITIAL_RATING]),
    );
    const isolatedPlayerRatings = new Map(
      playerKeys.map((key) => [key, players.get(key)?.isolatedRating ?? INITIAL_RATING]),
    );
    const ranks = game.results.map((result) => result.rank);
    const { deltas: playerDeltas } = applyGameRatings(playerRatings, playerKeys, ranks);
    const { deltas: isolatedPlayerDeltas } = applyGameRatings(
      isolatedPlayerRatings,
      playerKeys,
      ranks,
    );

    playerKeys.forEach((key, index) => {
      const result = game.results[index];
      applyResult(players.get(key)!, {
        gameId: game.id,
        date: game.date,
        season: game.season,
        rank: result.rank,
        points: result.points,
        delta: playerDeltas[index],
        isolatedDelta: isolatedPlayerDeltas[index],
        opponents: playerKeys.filter((name) => name !== key),
        team: result.team,
        photo: result.photo,
        logo: result.teamLogo,
      });
    });

    if (teamKeys.length === game.results.length) {
      const teamRatings = new Map(
        teamKeys.map((key) => [key, teams.get(key)?.rating ?? INITIAL_RATING]),
      );
      const isolatedTeamRatings = new Map(
        teamKeys.map((key) => [key, teams.get(key)?.isolatedRating ?? INITIAL_RATING]),
      );
      const { deltas: teamDeltas } = applyGameRatings(teamRatings, teamKeys, ranks);
      const { deltas: isolatedTeamDeltas } = applyGameRatings(
        isolatedTeamRatings,
        teamKeys,
        ranks,
      );
      teamKeys.forEach((key, index) => {
        const result = game.results[index];
        applyResult(teams.get(key)!, {
          gameId: game.id,
          date: game.date,
          season: game.season,
          rank: result.rank,
          points: result.points,
          delta: teamDeltas[index],
          isolatedDelta: isolatedTeamDeltas[index],
          opponents: teamKeys.filter((name) => name !== key),
          team: result.team,
          logo: result.teamLogo,
        });
      });
    }
  }

  const latestSeason =
    cache.seasons.at(-1)?.id ??
    [...new Set(games.map((game) => game.season))].sort().at(-1) ??
    "";

  const playerProfiles: PlayerProfile[] = [...players.values()]
    .map((entity) => {
      const meta = getTeamMeta(entity.team);
      return {
        slug: slugify(entity.name),
        name: entity.name,
        photo: entity.photo,
        team: entity.team,
        teamSlug: meta?.slug ?? teamSlug(entity.team),
        rating: entity.rating,
        peakRating: entity.peak,
        career: careerFrom(entity),
        seasons: [...entity.seasons.values()]
          .sort((a, b) => a.season.localeCompare(b.season))
          .map(toSeasonRecord),
        history: entity.history,
      };
    })
    .sort((a, b) => b.rating - a.rating);

  const teamProfiles: TeamProfile[] = TEAMS.filter((team) => teams.has(team.name)).map((meta) => {
    const entity = teams.get(meta.name)!;
    const roster = playerProfiles
      .filter((player) => player.seasons.some((season) => season.season === latestSeason && season.team === meta.name))
      .map((player) => {
        const seasonRecord = player.seasons.find((season) => season.season === latestSeason);
        return {
          name: player.name,
          slug: player.slug,
          photo: player.photo,
          rating: seasonRecord?.isolatedRating ?? player.rating,
          points: seasonRecord?.points ?? 0,
        };
      });
    return {
      slug: meta.slug,
      name: meta.name,
      shortName: meta.shortName,
      color: meta.color,
      logo: entity.logo,
      rating: entity.rating,
      peakRating: entity.peak,
      career: careerFrom(entity),
      seasons: [...entity.seasons.values()]
        .sort((a, b) => a.season.localeCompare(b.season))
        .map(toSeasonRecord),
      history: entity.history,
      roster,
    };
  });

  teamProfiles.sort((a, b) => b.rating - a.rating);

  const logos = new Map(teamProfiles.map((team) => [team.name, team.logo]));
  const seasonIds = [...new Set(games.map((game) => game.season))].sort();
  const playerRankings: Record<string, RankingRow[]> = {
    [CAREER_SCOPE]: rankingFromPlayersCareer(playerProfiles, logos),
  };
  const teamRankings: Record<string, RankingRow[]> = {
    [CAREER_SCOPE]: rankingFromTeamsCareer(teamProfiles),
  };
  for (const seasonId of seasonIds) {
    playerRankings[seasonId] = rankingFromPlayers(playerProfiles, seasonId, logos);
    teamRankings[seasonId] = rankingFromTeams(teamProfiles, seasonId);
  }

  return {
    fetchedAt: cache.fetchedAt,
    source: cache.source,
    seasons: cache.seasons,
    latestSeason,
    games,
    players: playerProfiles,
    teams: teamProfiles,
    playerRankings,
    teamRankings,
  };
}

function rankingFromPlayers(
  players: PlayerProfile[],
  season: string,
  logos: Map<string, string>,
): RankingRow[] {
  return players
    .map((player) => {
      const seasonRecord = player.seasons.find((item) => item.season === season);
      if (!seasonRecord) return null;
      const teamName = seasonRecord.team || player.team;
      return toRankingRow({
        slug: player.slug,
        name: player.name,
        team: teamName,
        teamSlug: teamSlug(teamName),
        photo: player.photo,
        logo: seasonRecord.logo || logos.get(teamKey(teamName)) || "",
        color: getTeamMeta(teamName)?.color ?? "#888",
        rating: seasonRecord.isolatedRating,
        ratingDelta: seasonRecord.isolatedRating - INITIAL_RATING,
        record: seasonRecord,
      });
    })
    .filter((row): row is RankingRow => row !== null)
    .sort(compareRanking)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function rankingFromTeams(teams: TeamProfile[], season: string): RankingRow[] {
  return teams
    .map((team) => {
      const seasonRecord = team.seasons.find((item) => item.season === season);
      if (!seasonRecord) return null;
      return toRankingRow({
        slug: team.slug,
        name: seasonRecord.team || team.name,
        team: seasonRecord.team || team.name,
        teamSlug: team.slug,
        photo: "",
        logo: seasonRecord.logo || team.logo,
        color: team.color,
        rating: seasonRecord.isolatedRating,
        ratingDelta: seasonRecord.isolatedRating - INITIAL_RATING,
        record: seasonRecord,
      });
    })
    .filter((row): row is RankingRow => row !== null)
    .sort(compareRanking)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function rankingFromPlayersCareer(
  players: PlayerProfile[],
  logos: Map<string, string>,
): RankingRow[] {
  return players
    .filter((player) => player.career.games > 0)
    .map((player) =>
      toRankingRow({
        slug: player.slug,
        name: player.name,
        team: player.team,
        teamSlug: player.teamSlug,
        photo: player.photo,
        logo: logos.get(teamKey(player.team)) || logos.get(player.team) || "",
        color: getTeamMeta(player.team)?.color ?? "#888",
        rating: player.rating,
        ratingDelta: player.rating - INITIAL_RATING,
        record: player.career,
      }),
    )
    .sort(compareRanking)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function rankingFromTeamsCareer(teams: TeamProfile[]): RankingRow[] {
  return teams
    .filter((team) => team.career.games > 0)
    .map((team) =>
      toRankingRow({
        slug: team.slug,
        name: team.name,
        team: team.name,
        teamSlug: team.slug,
        photo: "",
        logo: team.logo,
        color: team.color,
        rating: team.rating,
        ratingDelta: team.rating - INITIAL_RATING,
        record: team.career,
      }),
    )
    .sort(compareRanking)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function compareRanking(a: RankingRow, b: RankingRow): number {
  const ratingDiff = roundTo(b.rating, 1) - roundTo(a.rating, 1);
  if (ratingDiff !== 0) return ratingDiff;
  return b.points - a.points;
}

function toRankingRow(args: {
  slug: string;
  name: string;
  team: string;
  teamSlug: string;
  photo: string;
  logo: string;
  color: string;
  rating: number;
  ratingDelta: number;
  record: SeasonRecord;
}): RankingRow {
  const games = args.record.games;
  return {
    rank: 0,
    slug: args.slug,
    name: args.name,
    team: args.team,
    teamSlug: args.teamSlug,
    photo: args.photo,
    logo: args.logo,
    color: args.color,
    rating: args.rating,
    ratingDelta: args.ratingDelta,
    games,
    points: args.record.points,
    avgRank: args.record.avgRank,
    rankCounts: args.record.rankCounts,
    topRate: games ? args.record.rankCounts[0] / games : 0,
    rentaiRate: games ? (args.record.rankCounts[0] + args.record.rankCounts[1]) / games : 0,
  };
}

export function findPlayer(dataset: Dataset, slug: string): PlayerProfile | undefined {
  const decoded = safeDecode(slug).normalize("NFC");
  return dataset.players.find((player) => {
    const name = player.name.normalize("NFC");
    return (
      player.slug === slug ||
      player.slug === decoded ||
      name === decoded ||
      slugify(name) === decoded
    );
  });
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function findTeam(dataset: Dataset, slug: string): TeamProfile | undefined {
  return dataset.teams.find((team) => team.slug === slug);
}

export function resolveRankingScope(
  dataset: Dataset,
  raw: string | string[] | undefined,
): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return dataset.latestSeason;
  if (value === CAREER_SCOPE) return CAREER_SCOPE;
  if (dataset.playerRankings[value]) return value;
  return dataset.latestSeason;
}
