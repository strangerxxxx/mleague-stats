import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverSeasons,
  mergeDiscoveredSeasons,
  parseOfficialGamesApi,
  parseOfficialMatchCards,
} from "./parse";

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

test("parseOfficialGamesApi keeps complete JST results and skips unfinished games", () => {
  const games = parseOfficialGamesApi(
    {
      games: [
        {
          date: "2026-10-29T15:00:00.000Z",
          no: 1,
          desk: 0,
          complete: true,
          players: [
            {
              name: "岡田 紗佳",
              team: "KONAMI 麻雀格闘倶楽部",
              point: 61.7,
              rank: 1,
              image: "/wp/a.png",
              teamImage: "/wp/t.png",
            },
            { name: "松本 吉弘", team: "渋谷ABEMAS", point: 12.8, rank: 2 },
            { name: "瀬戸熊 直樹", team: "TEAM RAIDEN / 雷電", point: -17.8, rank: 3 },
            { name: "滝沢 和典", team: "KONAMI 麻雀格闘倶楽部", point: -56.7, rank: 4 },
          ],
        },
        {
          date: "2026-11-04T15:00:00.000Z",
          no: 1,
          desk: 0,
          complete: false,
          players: [
            { name: "A", team: "EARTH JETS", point: 0, rank: 1 },
            { name: "B", team: "赤坂ドリブンズ", point: 0, rank: 2 },
            { name: "C", team: "EX風林火山", point: 0, rank: 3 },
            { name: "D", team: "BEAST X", point: 0, rank: 4 },
          ],
        },
      ],
    },
    "2026-27",
  );
  assert.equal(games.length, 1);
  assert.equal(games[0]?.date, "2026-10-30");
  assert.equal(games[0]?.id, "20261030-0-1");
  assert.equal(games[0]?.session, 0);
  assert.equal(games[0]?.round, 1);
  assert.equal(games[0]?.results[0]?.player, "岡田紗佳");
  assert.equal(games[0]?.results[0]?.team, "KONAMI麻雀格闘倶楽部");
  assert.equal(games[0]?.results[0]?.photo, "https://m-league.jp/wp/a.png");
});

test("parseOfficialMatchCards groups unfinished desks and skips completed games", () => {
  const cards = parseOfficialMatchCards(
    {
      games: [
        {
          date: "2026-10-29T15:00:00.000Z",
          no: 1,
          desk: 0,
          complete: true,
          players: [
            { team: "EARTH JETS", teamImage: "/wp/jets.png" },
            { team: "赤坂ドリブンズ" },
            { team: "EX風林火山" },
            { team: "BEAST X" },
          ],
        },
        {
          date: "2026-11-04T10:00:00.000Z",
          no: 1,
          desk: 0,
          complete: false,
          players: [
            { name: null, team: "EARTH JETS", teamImage: "/wp/jets.png" },
            { name: null, team: "KADOKAWAサクラナイツ", teamImage: "/wp/sakura.png" },
            { name: null, team: "KONAMI 麻雀格闘倶楽部", teamImage: "/wp/konami.png" },
            { name: null, team: "TEAM RAIDEN / 雷電", teamImage: "/wp/raiden.png" },
          ],
        },
        {
          date: "2026-11-04T10:00:00.000Z",
          no: 2,
          desk: 0,
          complete: false,
          players: [
            { team: "EARTH JETS", teamImage: "/wp/jets.png" },
            { team: "KADOKAWAサクラナイツ" },
            { team: "KONAMI 麻雀格闘倶楽部" },
            { team: "TEAM RAIDEN / 雷電" },
          ],
        },
        {
          date: "2026-11-04T10:00:00.000Z",
          no: 1,
          desk: 1,
          complete: false,
          players: [
            { team: "赤坂ドリブンズ", teamImage: "/wp/drivens.png" },
            { team: "EX風林火山" },
            { team: "渋谷ABEMAS" },
            { team: "セガサミーフェニックス" },
          ],
        },
      ],
    },
    "2026-27",
  );
  assert.equal(cards.length, 2);
  assert.equal(cards[0]?.id, "20261104-0");
  assert.equal(cards[0]?.date, "2026-11-04");
  assert.equal(cards[0]?.desk, 0);
  assert.deepEqual(
    cards[0]?.teams.map((team) => team.name),
    ["EARTH JETS", "KADOKAWAサクラナイツ", "KONAMI麻雀格闘倶楽部", "TEAM RAIDEN / 雷電"],
  );
  assert.equal(cards[0]?.teams[0]?.logo, "https://m-league.jp/wp/jets.png");
  assert.equal(cards[0]?.teams[0]?.slug, "earth-jets");
  assert.equal(cards[1]?.id, "20261104-1");
  assert.equal(cards[1]?.desk, 1);
});
