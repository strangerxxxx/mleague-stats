import assert from "node:assert/strict";
import test from "node:test";
import { discoverSeasons, mergeDiscoveredSeasons } from "./parse";

test("discoverSeasons accepts archive hrefs without /games/", () => {
  const seasons = discoverSeasons(
    `<a href="/2025-season/">2025-26シーズン</a><a href="/games/2024-season/">2024-25</a>`,
  );
  assert.ok(seasons.some((season) => season.id === "2025-26"));
  assert.ok(seasons.some((season) => season.id === "2024-25"));
});

test("mergeDiscoveredSeasons keeps cached history when the index only lists the current season", () => {
  const merged = mergeDiscoveredSeasons(
    [{ id: "2026-27", label: "2026-27", url: "https://m-league.jp/games/", historical: false }],
    {
      seasons: [
        { id: "2018-19", label: "2018-19", url: "https://m-league.jp/2018-season/", historical: true },
      ],
      games: [{ season: "2024-25" }],
    },
  );
  assert.deepEqual(
    merged.map((season) => season.id),
    ["2018-19", "2024-25", "2026-27"],
  );
  assert.equal(merged.find((season) => season.id === "2018-19")?.historical, true);
});
