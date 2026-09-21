import assert from "node:assert/strict";
import test from "node:test";
import type { Game } from "./types";
import { matchNumberByGameId } from "./matchDay";

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

test("numbers two tables on the same day as #1 and #2", () => {
  const map = matchNumberByGameId([
    game("a", "2026-09-18", 4, 1),
    game("b", "2026-09-18", 4, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
});

test("numbers each table of a two-match day in play order", () => {
  const map = matchNumberByGameId([
    game("a", "2025-09-25", 7, 1),
    game("b", "2025-09-25", 7, 2),
    game("c", "2025-09-25", 8, 1),
    game("d", "2025-09-25", 8, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
  assert.equal(map.get("c"), 3);
  assert.equal(map.get("d"), 4);
});

test("restarts numbering on each date", () => {
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

test("numbers tables even when session is unknown", () => {
  const map = matchNumberByGameId([
    game("a", "2018-10-01", 0, 1),
    game("b", "2018-10-01", 0, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
});
