import { cache } from "react";
import { fetchAllGames, loadCachedGames } from "./fetch";
import { buildDataset } from "./stats";
import type { Dataset } from "./types";

export const getDataset = cache(async (): Promise<Dataset> => {
  const live = await fetchAllGames().catch(async (error) => {
    const cached = await loadCachedGames();
    if (!cached) throw error;
    console.error("Live fetch failed, using cache", error);
    return cached;
  });
  return buildDataset(live);
});
