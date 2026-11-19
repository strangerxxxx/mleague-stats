import assert from "node:assert/strict";
import test from "node:test";
import { INITIAL_RATING, applyGameRatings, ratingDelta, sharedRankPoints } from "./rating";
import { parsePoints } from "./parse";

test("equal ratings stay zero-sum with 0.5 factor", () => {
  const ratings = new Map([
    ["a", INITIAL_RATING],
    ["b", INITIAL_RATING],
    ["c", INITIAL_RATING],
    ["d", INITIAL_RATING],
  ] as const);
  const { deltas, next } = applyGameRatings(
    new Map(ratings),
    ["a", "b", "c", "d"],
    [1, 2, 3, 4],
  );
  assert.equal(Math.round(deltas.reduce((sum, value) => sum + value, 0) * 1e9), 0);
  assert.equal(deltas[0], 22.5);
  assert.equal(deltas[1], 2.5);
  assert.equal(deltas[2], -7.5);
  assert.equal(deltas[3], -17.5);
  assert.equal(next.get("a"), 1522.5);
  assert.equal(next.get("d"), 1482.5);
});

test("table correction pulls toward the average", () => {
  const delta = ratingDelta({
    ownRating: 1700,
    tableAverage: 1500,
    rank: 1,
  });
  // 0.5 × (45 + (1500 - 1700) / 40) = 0.5 × 40 = 20
  assert.equal(delta, 20);
});

test("tied first place splits 1st and 2nd rank points", () => {
  assert.deepEqual(sharedRankPoints([1, 1, 3, 4]), [25, 25, -15, -35]);
  const ratings = new Map([
    ["a", INITIAL_RATING],
    ["b", INITIAL_RATING],
    ["c", INITIAL_RATING],
    ["d", INITIAL_RATING],
  ] as const);
  const { deltas } = applyGameRatings(new Map(ratings), ["a", "b", "c", "d"], [1, 1, 3, 4]);
  assert.equal(deltas[0], 12.5);
  assert.equal(deltas[1], 12.5);
  assert.equal(deltas[2], -7.5);
  assert.equal(deltas[3], -17.5);
  assert.equal(Math.round(deltas.reduce((sum, value) => sum + value, 0) * 1e9), 0);
});

test("tied second place splits 2nd and 3rd rank points", () => {
  assert.deepEqual(sharedRankPoints([1, 2, 2, 4]), [45, -5, -5, -35]);
});

test("tied third place splits 3rd and 4th rank points", () => {
  assert.deepEqual(sharedRankPoints([1, 2, 3, 3]), [45, 5, -25, -25]);
});

test("equal points split even when ranks are 1 through 4", () => {
  assert.deepEqual(
    sharedRankPoints([1, 2, 3, 4], [33.9, 33.9, -19, -48.8]),
    [25, 25, -15, -35],
  );
});

test("parses official point notation", () => {
  assert.equal(parsePoints("58pt"), 58);
  assert.equal(parsePoints("▲42.3pt"), -42.3);
  assert.equal(parsePoints("3.8pt"), 3.8);
  assert.equal(parsePoints("選手1-4得点pt"), null);
});
