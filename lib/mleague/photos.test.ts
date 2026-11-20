import assert from "node:assert/strict";
import test from "node:test";
import { displayLogoUrls, displayPhotoUrls, photoFilename, replacePhotoUrls } from "./photos";
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

test("replacePhotoUrls rewrites archived team logos", () => {
  const game: Game = {
    id: "a",
    season: "2023-24",
    date: "2023-10-01",
    session: 0,
    round: 1,
    results: [
      {
        rank: 1,
        player: "A",
        team: "BEAST Japanext",
        points: 10,
        photo: "",
        teamLogo: "https://m-league.jp/wp/beast-1.png",
      },
      {
        rank: 2,
        player: "B",
        team: "BEAST X",
        points: 0,
        photo: "",
        teamLogo: "https://m-league.jp/wp/beast-2.png",
      },
      {
        rank: 3,
        player: "C",
        team: "赤坂ドリブンズ",
        points: -5,
        photo: "",
        teamLogo: "https://m-league.jp/wp/d.png",
      },
      {
        rank: 4,
        player: "D",
        team: "EX風林火山",
        points: -5,
        photo: "",
        teamLogo: "https://m-league.jp/wp/e.png",
      },
    ],
  };
  const rewritten = replacePhotoUrls(
    [game],
    new Map([["https://m-league.jp/wp/beast-1.png", "https://example.com/photos/beast-1.png"]]),
  );
  assert.equal(rewritten[0]?.results[0]?.teamLogo, "https://example.com/photos/beast-1.png");
  assert.equal(rewritten[0]?.results[1]?.teamLogo, "https://m-league.jp/wp/beast-2.png");
});

test("displayPhotoUrls keeps each player's latest portrait", () => {
  const older: Game = {
    id: "old",
    season: "2018-19",
    date: "2018-10-01",
    session: 0,
    round: 1,
    results: [
      { rank: 1, player: "渋川難波", team: "A", points: 10, photo: "https://m-league.jp/wp/old.png", teamLogo: "" },
      { rank: 2, player: "B", team: "B", points: 0, photo: "https://m-league.jp/wp/b.png", teamLogo: "" },
      { rank: 3, player: "C", team: "C", points: -5, photo: "https://m-league.jp/wp/c.png", teamLogo: "" },
      { rank: 4, player: "D", team: "D", points: -5, photo: "https://m-league.jp/wp/d.png", teamLogo: "" },
    ],
  };
  const newer: Game = {
    ...older,
    id: "new",
    date: "2025-05-01",
    results: older.results.map((result) =>
      result.player === "渋川難波" ? { ...result, photo: "https://m-league.jp/wp/latest.png" } : result,
    ),
  };
  assert.deepEqual(displayPhotoUrls([older, newer]), [
    "https://m-league.jp/wp/latest.png",
    "https://m-league.jp/wp/b.png",
    "https://m-league.jp/wp/c.png",
    "https://m-league.jp/wp/d.png",
  ]);
});

test("displayLogoUrls keeps a renamed team's previous icon", () => {
  const japanext: Game = {
    id: "old",
    season: "2023-24",
    date: "2023-10-01",
    session: 0,
    round: 1,
    results: [
      {
        rank: 1,
        player: "A",
        team: "BEAST Japanext",
        points: 10,
        photo: "",
        teamLogo: "https://m-league.jp/wp/beast-1.png",
      },
      {
        rank: 2,
        player: "B",
        team: "EARTH JETS",
        points: 0,
        photo: "",
        teamLogo: "https://m-league.jp/wp/jets.png",
      },
      {
        rank: 3,
        player: "C",
        team: "赤坂ドリブンズ",
        points: -5,
        photo: "",
        teamLogo: "https://m-league.jp/wp/d.png",
      },
      {
        rank: 4,
        player: "D",
        team: "EX風林火山",
        points: -5,
        photo: "",
        teamLogo: "https://m-league.jp/wp/e.png",
      },
    ],
  };
  const renamed: Game = {
    ...japanext,
    id: "new",
    season: "2024-25",
    date: "2024-10-01",
    results: japanext.results.map((result) =>
      result.team === "BEAST Japanext"
        ? { ...result, team: "BEAST X", teamLogo: "https://m-league.jp/wp/beast-2.png" }
        : result,
    ),
  };
  const logos = displayLogoUrls([japanext, renamed]);
  assert.equal(logos.includes("https://m-league.jp/wp/beast-1.png"), true);
  assert.equal(logos.includes("https://m-league.jp/wp/beast-2.png"), true);
});
