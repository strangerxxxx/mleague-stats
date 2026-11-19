import assert from "node:assert/strict";
import test from "node:test";
import { photoFilename, replacePhotoUrls } from "./photos";
import type { Game } from "./types";

test("photoFilename keeps the official file name", () => {
  assert.equal(
    photoFilename("https://m-league.jp/wp/wp-content/uploads/2018/10/profile_kondo_seiichi.png"),
    "profile_kondo_seiichi.png",
  );
});

test("replacePhotoUrls rewrites archived portraits", () => {
  const game: Game = {
    id: "a",
    season: "2025-26",
    date: "2026-05-01",
    session: 0,
    round: 1,
    results: [
      {
        rank: 1,
        player: "渋川難波",
        team: "KADOKAWAサクラナイツ",
        points: 10,
        photo: "https://m-league.jp/wp/a.png",
        teamLogo: "",
      },
      {
        rank: 2,
        player: "B",
        team: "EARTH JETS",
        points: 0,
        photo: "https://m-league.jp/wp/b.png",
        teamLogo: "",
      },
      {
        rank: 3,
        player: "C",
        team: "赤坂ドリブンズ",
        points: -5,
        photo: "https://m-league.jp/wp/c.png",
        teamLogo: "",
      },
      {
        rank: 4,
        player: "D",
        team: "EX風林火山",
        points: -5,
        photo: "https://m-league.jp/wp/d.png",
        teamLogo: "",
      },
    ],
  };
  const rewritten = replacePhotoUrls(
    [game],
    new Map([["https://m-league.jp/wp/a.png", "https://example.com/photos/a.png"]]),
  );
  assert.equal(rewritten[0]?.results[0]?.photo, "https://example.com/photos/a.png");
  assert.equal(rewritten[0]?.results[1]?.photo, "https://m-league.jp/wp/b.png");
});
