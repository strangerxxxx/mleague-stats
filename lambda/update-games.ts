import { fetchAllGames, loadCachedGames } from "../lib/mleague/fetch";

type UpdateEvent = {
  refreshAll?: boolean;
};

export async function handler(event: UpdateEvent = {}) {
  const existing = await loadCachedGames();
  const refreshAll = event.refreshAll === true || !existing;
  const cache = await fetchAllGames({
    refreshAll,
    persist: true,
    maxAgeMs: 0,
  });
  const seasons = [...new Set(cache.games.map((game) => game.season))].sort();
  return {
    ok: true,
    refreshAll,
    fetchedAt: cache.fetchedAt,
    games: cache.games.length,
    seasons,
  };
}
