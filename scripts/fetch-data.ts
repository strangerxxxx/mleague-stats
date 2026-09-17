import { fetchAllGames } from "../lib/mleague/fetch";

async function main() {
  const refreshAll = process.argv.includes("--all");
  const cache = await fetchAllGames({ refreshAll, persist: true, maxAgeMs: 0 });
  const seasons = [...new Set(cache.games.map((game) => game.season))].sort();
  console.log(
    JSON.stringify(
      {
        fetchedAt: cache.fetchedAt,
        games: cache.games.length,
        seasons,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
