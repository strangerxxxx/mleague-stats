import { latestMatchDay, type MatchDay } from "./matchDay";
import {
  CAREER_SCOPE,
  SNAPSHOT_VERSION,
  type Dataset,
  type SiteSearchItem,
} from "./types";

export type SiteSnapshot = {
  version: typeof SNAPSHOT_VERSION;
  fetchedAt: string;
  source: string;
  seasons: Dataset["seasons"];
  latestSeason: string;
  playerRankings: Dataset["playerRankings"];
  teamRankings: Dataset["teamRankings"];
  searchItems: SiteSearchItem[];
  latestMatchDays: Record<string, MatchDay | null>;
};

export function buildSiteSnapshot(dataset: Dataset): SiteSnapshot {
  const seasonIds = new Set<string>([
    CAREER_SCOPE,
    dataset.latestSeason,
    ...dataset.seasons.map((season) => season.id),
    ...Object.keys(dataset.playerRankings),
  ]);
  const latestMatchDays: Record<string, MatchDay | null> = {};
  for (const seasonId of seasonIds) {
    latestMatchDays[seasonId] = latestMatchDay(dataset, seasonId);
  }

  return {
    version: SNAPSHOT_VERSION,
    fetchedAt: dataset.fetchedAt,
    source: dataset.source,
    seasons: dataset.seasons,
    latestSeason: dataset.latestSeason,
    playerRankings: dataset.playerRankings,
    teamRankings: dataset.teamRankings,
    searchItems: [
      ...dataset.players.map((player) => ({
        href: `/players/${player.slug}`,
        name: player.name,
        kind: "player" as const,
        sub: player.team,
      })),
      ...dataset.teams.map((team) => ({
        href: `/teams/${team.slug}`,
        name: team.name,
        kind: "team" as const,
        image: team.logo,
      })),
    ],
    latestMatchDays,
  };
}

export function isSiteSnapshot(value: unknown): value is SiteSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as SiteSnapshot;
  return (
    snapshot.version === SNAPSHOT_VERSION &&
    typeof snapshot.fetchedAt === "string" &&
    typeof snapshot.latestSeason === "string" &&
    Array.isArray(snapshot.seasons) &&
    Array.isArray(snapshot.searchItems) &&
    !!snapshot.playerRankings &&
    typeof snapshot.playerRankings === "object" &&
    !!snapshot.teamRankings &&
    typeof snapshot.teamRankings === "object" &&
    !!snapshot.latestMatchDays &&
    typeof snapshot.latestMatchDays === "object"
  );
}
