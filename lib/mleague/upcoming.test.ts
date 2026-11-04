import assert from "node:assert/strict";
import test from "node:test";
import { deskLabel, nextUpcomingMatchDay } from "./upcoming";
import type { MatchCard, RankingRow } from "./types";

function card(
  date: string,
  desk: number,
  teams: string[],
): MatchCard {
  return {
    id: `${date.replaceAll("-", "")}-${desk}`,
    date,
    season: "2026-27",
    desk,
    teams: teams.map((name) => ({ name, slug: name, logo: "" })),
  };
}

test("deskLabel uses 白卓 and 黒卓 when two tables play", () => {
  assert.equal(deskLabel(0, 2), "白卓");
  assert.equal(deskLabel(1, 2), "黒卓");
  assert.equal(deskLabel(0, 1), "対戦カード");
});

test("nextUpcomingMatchDay keeps the next JST day and drops past cards", () => {
  const day = nextUpcomingMatchDay(
    [
      card("2026-11-03", 0, ["EARTH JETS", "赤坂ドリブンズ", "EX風林火山", "BEAST X"]),
      card("2026-11-05", 1, [
        "赤坂ドリブンズ",
        "EX風林火山",
        "渋谷ABEMAS",
        "セガサミーフェニックス",
      ]),
      card("2026-11-05", 0, [
        "EARTH JETS",
        "KADOKAWAサクラナイツ",
        "KONAMI麻雀格闘倶楽部",
        "TEAM RAIDEN / 雷電",
      ]),
      card("2026-11-06", 0, ["EARTH JETS", "赤坂ドリブンズ", "EX風林火山", "BEAST X"]),
    ],
    [
      {
        rank: 1,
        slug: "earth-jets",
        name: "EARTH JETS",
        team: "EARTH JETS",
        teamSlug: "earth-jets",
        photo: "",
        logo: "/jets.png",
        color: "#1fa37a",
        rating: 1512.3,
        ratingDelta: 0,
        games: 10,
        points: 20,
        avgRank: 2,
        rankCounts: [1, 2, 3, 4],
        topRate: 0.1,
        rentaiRate: 0.3,
      } satisfies RankingRow,
    ],
    new Date("2026-11-04T14:00:00Z"),
  );
  assert.ok(day);
  assert.equal(day.date, "2026-11-05");
  assert.deepEqual(
    day.tables.map((table) => table.label),
    ["白卓", "黒卓"],
  );
  assert.equal(day.tables[0]?.teams[0]?.name, "EARTH JETS");
  assert.equal(day.tables[0]?.teams[0]?.slug, "earth-jets");
  assert.equal(day.tables[0]?.teams[0]?.shortName, "ジェッツ");
  assert.equal(day.tables[0]?.teams[0]?.rating, 1512.3);
});
