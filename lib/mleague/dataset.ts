import { cache } from "react";
import { fetchAllGames, loadCachedGames } from "./fetch";
import { buildDataset } from "./stats";
import type { Dataset } from "./types";

export const getDataset = cache(async (): Promise<Dataset> => {
  const remote = process.env.GAMES_DATA_URL || process.env.GAMES_S3_BUCKET;
  if (remote) {
    const cached = await loadCachedGames();
    if (!cached) {
      throw new Error("Games data is not available");
    }
    return buildDataset(cached);
  }

  const live = await fetchAllGames().catch(async (error) => {
    const cached = await loadCachedGames();
    if (!cached) throw error;
    console.error("Live fetch failed, using cache", error);
    return cached;
  });
  return buildDataset(live);
});
