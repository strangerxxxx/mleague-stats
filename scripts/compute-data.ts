import { gzipSync } from "node:zlib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadCachedGames, saveComputedDataset } from "../lib/mleague/store";
import { buildDataset } from "../lib/mleague/stats";
import { buildSiteSnapshot } from "../lib/mleague/site";

async function main() {
  const games = await loadCachedGames();
  if (!games) throw new Error("games.json is missing");
  const dataset = buildDataset(games);
  await saveComputedDataset(dataset);
  const site = JSON.stringify(buildSiteSnapshot(dataset));
  const profiles = await readFile(path.join(process.cwd(), "data", "dataset.json"));
  console.log(
    JSON.stringify(
      {
        fetchedAt: dataset.fetchedAt,
        games: games.games.length,
        players: dataset.players.length,
        teams: dataset.teams.length,
        siteBytes: Buffer.byteLength(site),
        siteGzip: gzipSync(Buffer.from(site)).length,
        datasetBytes: profiles.length,
        datasetGzip: gzipSync(profiles).length,
        latestDate: dataset.games.at(-1)?.date,
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
