export type Rank = 1 | 2 | 3 | 4;

export type GameResult = {
  rank: Rank;
  player: string;
  team: string;
  points: number;
  photo: string;
  teamLogo: string;
};

export type Game = {
  id: string;
  season: string;
  date: string;
  session: number;
  round: number;
  results: GameResult[];
};

export type SeasonRef = {
  id: string;
  label: string;
  url: string;
  historical: boolean;
};

export type RatingEvent = {
  gameId: string;
  date: string;
  season: string;
  session: number;
  round: number;
  rank: Rank;
  points: number;
  ratingBefore: number;
  ratingAfter: number;
  delta: number;
  isolatedDelta: number;
  isolatedAfter: number;
  opponents: string[];
};

export type SeasonRecord = {
  season: string;
  games: number;
  points: number;
  rankCounts: [number, number, number, number];
  avgRank: number;
  ratingStart: number;
  ratingEnd: number;
  peakRating: number;
  isolatedRating: number;
  team: string;
  logo: string;
};

export type PlayerProfile = {
  slug: string;
  name: string;
  photo: string;
  team: string;
  teamSlug: string;
  rating: number;
  peakRating: number;
  career: SeasonRecord;
  seasons: SeasonRecord[];
  history: RatingEvent[];
};

export type TeamProfile = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
  rating: number;
  peakRating: number;
  career: SeasonRecord;
  seasons: SeasonRecord[];
  history: RatingEvent[];
  roster: { name: string; slug: string; photo: string; rating: number; points: number }[];
};

export type RankingRow = {
  rank: number;
  slug: string;
  name: string;
  team: string;
  teamSlug: string;
  photo: string;
  logo: string;
  color: string;
  rating: number;
  ratingDelta: number;
  games: number;
  points: number;
  avgRank: number;
  rankCounts: [number, number, number, number];
  topRate: number;
  rentaiRate: number;
};

export const CAREER_SCOPE = "career";

export type CachedGames = {
  fetchedAt: string;
  source: string;
  seasons: SeasonRef[];
  games: Game[];
};

export type Dataset = {
  fetchedAt: string;
  source: string;
  seasons: SeasonRef[];
  latestSeason: string;
  games: Game[];
  players: PlayerProfile[];
  teams: TeamProfile[];
  playerRankings: Record<string, RankingRow[]>;
  teamRankings: Record<string, RankingRow[]>;
};

export const SNAPSHOT_VERSION = 1;

export type ComputedProfiles = {
  version: typeof SNAPSHOT_VERSION;
  fetchedAt: string;
  source: string;
  seasons: SeasonRef[];
  latestSeason: string;
  players: PlayerProfile[];
  teams: TeamProfile[];
};

export type SiteSearchItem = {
  href: string;
  name: string;
  kind: "player" | "team";
  sub?: string;
  image?: string;
};
