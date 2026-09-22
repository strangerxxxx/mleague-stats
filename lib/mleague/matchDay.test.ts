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

test("falls back to #1 when round is missing", () => {
  const map = matchNumberByGameId([
    game("a", "2018-10-01", 0, 0),
    game("b", "2018-10-01", 0, 2),
  ]);
  assert.equal(map.get("a"), 1);
  assert.equal(map.get("b"), 2);
});
