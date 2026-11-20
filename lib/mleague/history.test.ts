import assert from "node:assert/strict";
import test from "node:test";
import {
  GAME_PAGE_SIZE,
  gamesHref,
  memberForTeamEvent,
  pageTokens,
  paginate,
  parsePage,
  playersByGameId,
} from "./history";
import type { PlayerProfile, RatingEvent, SeasonRecord } from "./types";

function event(gameId: string, rank: 1 | 2 | 3 | 4, season = "2026-27"): RatingEvent {
  return {
    gameId,
    date: "2026-11-19",
    season,
    session: 0,
    round: 1,
    rank,
    points: 10,
    ratingBefore: 1500,
    ratingAfter: 1510,
    delta: 10,
    isolatedDelta: 10,
    isolatedAfter: 1510,
    opponents: [],
  };
}

function season(team: string, id = "2026-27"): SeasonRecord {
  return {
    season: id,
    games: 1,
    points: 0,
    rankCounts: [0, 0, 0, 0],
    avgRank: 0,
    ratingStart: 1500,
    ratingEnd: 1500,
    peakRating: 1500,
    isolatedRating: 1500,
    team,
    logo: "",
  };
}

function player(name: string, team: string, history: RatingEvent[]): PlayerProfile {
  return {
    slug: name,
    name,
    photo: "",
    team,
    teamSlug: team,
    rating: 1500,
    peakRating: 1500,
    career: season(team),
    seasons: [season(team, history[0]?.season ?? "2026-27")],
    history,
  };
}

test("parsePage treats missing and invalid values as page 1", () => {
  assert.equal(parsePage(undefined), 1);
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-2"), 1);
  assert.equal(parsePage("abc"), 1);
  assert.equal(parsePage(["3"]), 3);
});

test("paginate newest pages and clamps out-of-range page numbers", () => {
  const items = [1, 2, 3, 4, 5];
  const first = paginate(items, 1, 2);
  assert.deepEqual(first.items, [1, 2]);
  assert.equal(first.current, 1);
  assert.equal(first.pageCount, 3);
  assert.equal(first.total, 5);

  const last = paginate(items, 99, 2);
  assert.deepEqual(last.items, [5]);
  assert.equal(last.current, 3);
});

test("gamesHref omits page=1 and keeps the games hash", () => {
  assert.equal(gamesHref("/players/東城りお", 1), "/players/東城りお#games");
  assert.equal(gamesHref("/teams/beast-x", 2), "/teams/beast-x?page=2#games");
});

test("pageTokens shows nearby pages and lets the user jump to the ends", () => {
  assert.deepEqual(
    pageTokens(1, 21).map((token) => (token.kind === "page" ? token.page : "…")),
    [1, 2, 3, "…", 21],
  );
  assert.deepEqual(
    pageTokens(10, 21).map((token) => (token.kind === "page" ? token.page : "…")),
    [1, "…", 8, 9, 10, 11, 12, "…", 21],
  );
  assert.deepEqual(
    pageTokens(21, 21).map((token) => (token.kind === "page" ? token.page : "…")),
    [1, "…", 19, 20, 21],
  );
});

test("pageTokens fills a one-page gap instead of an ellipsis", () => {
  assert.deepEqual(
    pageTokens(2, 6).map((token) => (token.kind === "page" ? token.page : "…")),
    [1, 2, 3, 4, 5, 6],
  );
});

test("memberForTeamEvent picks the teammate when two players share a rank", () => {
  const rio = player("東城りお", "BEAST X", [event("g1", 1)]);
  const taro = player("鈴木たろう", "赤坂ドリブンズ", [event("g1", 1)]);
  const byGame = playersByGameId([rio, taro]);
  const seated = memberForTeamEvent(byGame.get("g1"), "BEAST X", event("g1", 1));
  assert.equal(seated?.name, "東城りお");
});

test("memberForTeamEvent keeps BEAST Japanext games on the BEAST X page", () => {
  const rio = player("東城りお", "BEAST Japanext", [event("g-old", 2, "2023-24")]);
  rio.team = "BEAST X";
  rio.seasons = [season("BEAST Japanext", "2023-24")];
  const seated = memberForTeamEvent(playersByGameId([rio]).get("g-old"), "BEAST X", event("g-old", 2, "2023-24"));
  assert.equal(seated?.name, "東城りお");
});

test("default page size is 20", () => {
  assert.equal(GAME_PAGE_SIZE, 20);
});
