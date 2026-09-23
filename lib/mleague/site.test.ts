import assert from "node:assert/strict";
import test from "node:test";
import { buildDataset } from "./stats";
import { buildSiteSnapshot, isSiteSnapshot } from "./site";
import { CAREER_SCOPE, type CachedGames, type Game } from "./types";

function game(
  id: string,
  date: string,
  round: number,
  ranks: [string, string, string, string],
): Game {
  const teams = ["EARTH JETS", "赤坂ドリブンズ", "EX風林火山", "KADOKAWAサクラナイツ"] as const;
  return {
    id,
    season: "2025-26",
    date,
    session: round,
    round,
    results: ranks.map((player, index) => ({
      rank: (index + 1) as 1 | 2 | 3 | 4,
      player,
      team: teams[index],
      points: [50, 10, -20, -40][index],
      photo: "",
      teamLogo: "",
    })),
  };
}

test("precomputes rankings and latest match day without live scrape", () => {
  const cache: CachedGames = {
    fetchedAt: "2026-09-22T00:00:00.000Z",
    source: "test",
    seasons: [
      {
        id: "2025-26",
        label: "2025-26",
        url: "https://m-league.jp/games/",
        historical: false,
      },
    ],
    games: [
      game("a", "2026-09-21", 1, ["A", "B", "C", "D"]),
      game("b", "2026-09-21", 2, ["B", "A", "D", "C"]),
    ],
  };
  const snapshot = buildSiteSnapshot(buildDataset(cache));
  assert.equal(isSiteSnapshot(snapshot), true);
  assert.equal(snapshot.latestSeason, "2025-26");
  assert.ok(snapshot.playerRankings["2025-26"].length >= 4);
  assert.ok(snapshot.teamRankings["2025-26"].length >= 4);
  const day = snapshot.latestMatchDays["2025-26"];
  assert.ok(day);
  assert.equal(day.date, "2026-09-21");
  assert.deepEqual(
    day.matches.map((match) => match.matchNo),
    [1, 2],
  );
  assert.ok(snapshot.latestMatchDays[CAREER_SCOPE]);
  assert.ok(snapshot.searchItems.some((item) => item.name === "A" && item.kind === "player"));
  const firstSeat = day.matches[0]?.tables[0]?.seats[0];
  assert.ok(firstSeat);
  assert.equal(firstSeat.player, "A");
  assert.equal(firstSeat.ratingBefore, 1500);
  assert.equal(firstSeat.ratingAfter, 1522.5);
});
