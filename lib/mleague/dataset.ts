import { cache } from "react";
import { fetchAllGames, loadCachedGames } from "./fetch";
import { buildSiteSnapshot, type SiteSnapshot } from "./site";
import {
  loadComputedProfiles,
  loadSiteSnapshot,
} from "./store";
import { buildDataset } from "./stats";
import type { CachedGames, ComputedProfiles, Dataset } from "./types";

let built: { fetchedAt: string; dataset: Dataset } | null = null;

export const getSiteSnapshot = cache(async (): Promise<SiteSnapshot> => {
  const stored = await loadSiteSnapshot();
  if (stored) return stored;
  return buildSiteSnapshot(await getDatasetFromGames());
});

export const getDataset = cache(async (): Promise<Dataset> => {
  const profiles = await loadComputedProfiles();
  if (profiles) return profilesToDataset(profiles);
  return getDatasetFromGames();
});

async function getDatasetFromGames(): Promise<Dataset> {
  const games = await loadGames();
  if (built?.fetchedAt === games.fetchedAt) return built.dataset;
  const dataset = buildDataset(games);
  built = { fetchedAt: games.fetchedAt, dataset };
  return dataset;
}

function profilesToDataset(profiles: ComputedProfiles): Dataset {
  return {
    fetchedAt: profiles.fetchedAt,
    source: profiles.source,
    seasons: profiles.seasons,
    latestSeason: profiles.latestSeason,
    games: [],
    players: profiles.players,
    teams: profiles.teams,
    playerRankings: {},
    teamRankings: {},
  };
}

async function loadGames(): Promise<CachedGames> {
  const remote = process.env.GAMES_DATA_URL || process.env.GAMES_S3_BUCKET;
  if (remote) {
    const cached = await loadCachedGames();
    if (!cached) {
      throw new Error("Games data is not available");
    }
    return cached;
  }

  return fetchAllGames().catch(async (error) => {
    const cached = await loadCachedGames();
    if (!cached) throw error;
    console.error("Live fetch failed, using cache", error);
    return cached;
  });
}
