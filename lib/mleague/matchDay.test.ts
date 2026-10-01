import assert from "node:assert/strict";
import test from "node:test";
import { buildDataset } from "./stats";
import { CAREER_SCOPE, type CachedGames, type Game } from "./types";
import {
  latestMatchDay,
  matchNumberByGameId,
  prematchTableAverage,
  tableAverageRating,
  type MatchDaySeat,
} from "./matchDay";

function game(id: string, date: string, session: number, round: number): Game {
  return {
    id,
    season: "2025-26",
    date,
    session,
    round,
    results: [],
  };
}

test("numbers 第1回戦 as #1 and 第2回戦 as #2", () => {
  const map = matchNumberByGameId([
    game("a", "2026-09-18", 4, 1),
    game("b", "2026-09-18", 4, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
});

test("repeats #1 and #2 for each 試合 on a two-match day", () => {
  const map = matchNumberByGameId([
    game("a", "2026-09-21", 5, 1),
    game("b", "2026-09-21", 5, 2),
    game("c", "2026-09-21", 6, 1),
    game("d", "2026-09-21", 6, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
  assert.equal(map.get("c"), 1);
  assert.equal(map.get("d"), 2);
});

test("uses 回戦 numbers on every date", () => {
  const map = matchNumberByGameId([
    game("a", "2026-09-14", 1, 1),
    game("b", "2026-09-14", 1, 2),
    game("c", "2026-09-18", 4, 1),
    game("d", "2026-09-18", 4, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
  assert.equal(map.get("c"), 1);
  assert.equal(map.get("d"), 2);
});

function seat(
  ratingBefore: number | undefined,
  ratingAfter: number,
  delta = ratingAfter - (ratingBefore ?? ratingAfter),
): MatchDaySeat {
  return {
    rank: 1,
    player: "A",
    slug: "a",
    photo: "",
    team: "EARTH JETS",
    teamSlug: "earth-jets",
    logo: "",
    color: "#000",
    points: 0,
    delta,
    ratingBefore,
    ratingAfter,
  };
}

test("averages pre-match ratings and ignores post-match ratings", () => {
  const average = prematchTableAverage({
    seats: [
      seat(1600, 2000),
      seat(1500, 2000),
      seat(1400, 2000),
      seat(1300, 2000),
    ],
  });
  assert.equal(average, 1450);
});

test("falls back to rating after minus delta when pre-match rating is missing", () => {
  const average = prematchTableAverage({
    seats: [seat(undefined, 1510, 10), seat(1500, 1500, 0)],
  });
  assert.equal(average, 1500);
});

test("returns null when a seat rating is missing", () => {
  assert.equal(tableAverageRating([1500, undefined, 1500, 1500]), null);
});

test("latest match day stores the pre-match table average", () => {
  const teams = ["EARTH JETS", "赤坂ドリブンズ", "EX風林火山", "KADOKAWAサクラナイツ"] as const;
  function played(
    id: string,
    date: string,
    round: number,
    ranks: [string, string, string, string],
  ): Game {
    return {
      id,
      season: "2025-26",
      date,
      session: 1,
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
      played("a", "2026-09-22", 1, ["A", "B", "C", "D"]),
      played("b", "2026-09-22", 2, ["A", "B", "C", "E"]),
    ],
  };
  const dataset = buildDataset(cache);
  const day = latestMatchDay(dataset, "2025-26");
  assert.ok(day);
  assert.equal(day.matches[0]?.tables[0]?.averageRatingBefore, 1500);

  const second = day.matches[1]?.tables[0];
  assert.ok(second);
  const before = new Map(second.seats.map((item) => [item.player, item.ratingBefore]));
  assert.equal(before.get("A"), 1522.5);
  assert.equal(before.get("E"), 1500);
  assert.notEqual(second.seats.find((item) => item.player === "A")?.ratingAfter, 1522.5);
  assert.equal(second.averageRatingBefore, 1504.375);
  assert.equal(
    second.averageRatingBefore,
    prematchTableAverage(second),
  );

  const career = latestMatchDay(dataset, CAREER_SCOPE);
  assert.equal(career?.matches[1]?.tables[0]?.averageRatingBefore, 1504.375);
});

test("season view averages that season's pre-match ratings", () => {
  const teams = ["EARTH JETS", "赤坂ドリブンズ", "EX風林火山", "KADOKAWAサクラナイツ"] as const;
  function played(
    id: string,
    season: string,
    date: string,
    ranks: [string, string, string, string],
  ): Game {
    return {
      id,
      season,
      date,
      session: 1,
      round: 1,
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

  const dataset = buildDataset({
    fetchedAt: "2025-10-02T00:00:00.000Z",
    source: "test",
    seasons: [
      { id: "2024-25", label: "2024-25", url: "https://m-league.jp/games/", historical: true },
      { id: "2025-26", label: "2025-26", url: "https://m-league.jp/games/", historical: false },
    ],
    games: [
      played("old", "2024-25", "2024-10-01", ["A", "B", "C", "D"]),
      played("new", "2025-26", "2025-10-01", ["A", "B", "C", "E"]),
    ],
  });

  const season = latestMatchDay(dataset, "2025-26");
  const career = latestMatchDay(dataset, CAREER_SCOPE);
  assert.equal(season?.matches[0]?.tables[0]?.averageRatingBefore, 1500);
  assert.equal(career?.matches[0]?.tables[0]?.averageRatingBefore, 1504.375);
});

test("falls back to #1 when round is missing", () => {
  const map = matchNumberByGameId([
    game("a", "2018-10-01", 0, 0),
    game("b", "2018-10-01", 0, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
});
