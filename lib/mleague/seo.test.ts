import assert from "node:assert/strict";
import test from "node:test";
import {
  careerSeoDescription,
  homeSeoDescription,
  pageUrl,
  playerJsonLd,
  playerSeoDescription,
  rankingPageHeading,
  seasonSeoDescription,
  SITE_NAME,
  teamJsonLd,
  teamSeoDescription,
} from "./seo";
import { CAREER_SCOPE } from "./types";

test("pageUrl resolves Japanese player paths against the site origin", () => {
  assert.equal(pageUrl("/"), "https://m-league.strn.jp/");
  assert.equal(
    pageUrl("/players/東城りお"),
    "https://m-league.strn.jp/players/%E6%9D%B1%E5%9F%8E%E3%82%8A%E3%81%8A",
  );
  assert.equal(pageUrl("/teams/beast-x"), "https://m-league.strn.jp/teams/beast-x");
});

test("ranking headings stay unique per season view", () => {
  assert.equal(rankingPageHeading("2026-27", "2026-27"), SITE_NAME);
  assert.equal(rankingPageHeading(CAREER_SCOPE, "2026-27"), "通算レーティング");
  assert.equal(rankingPageHeading("2024-25", "2026-27"), "2024-25シーズンのレーティング");
});

test("SEO descriptions name the entity and stay unofficial", () => {
  assert.match(homeSeoDescription("2026-27"), /2026-27シーズン/);
  assert.match(careerSeoDescription(), /通算/);
  assert.match(seasonSeoDescription("2024-25"), /2024-25シーズン/);
  assert.match(
    playerSeoDescription({
      name: "東城りお",
      team: "BEAST X",
      rating: 1510.4,
      career: { games: 118, points: 12.3 },
    }),
    /東城りお（BEAST X）の非公式レーティングはR1510.4/,
  );
  assert.match(
    teamSeoDescription({
      name: "BEAST X",
      rating: 1488.2,
      career: { games: 405, points: -3.1 },
      roster: [{ name: "東城りお" }, { name: "下石戟" }],
    }),
    /今シーズンの選手は東城りお、下石戟/,
  );
});

test("JSON-LD uses Person and SportsTeam urls", () => {
  const person = playerJsonLd({
    name: "東城りお",
    slug: "東城りお",
    team: "BEAST X",
    teamSlug: "beast-x",
    description: "desc",
  });
  assert.equal(person["@type"], "Person");
  assert.equal(person.memberOf["@type"], "SportsTeam");
  assert.equal(person.memberOf.url, "https://m-league.strn.jp/teams/beast-x");

  const team = teamJsonLd({
    name: "BEAST X",
    slug: "beast-x",
    description: "desc",
    roster: [{ name: "東城りお", slug: "東城りお" }],
  });
  assert.equal(team["@type"], "SportsTeam");
  assert.equal(team.member[0]?.["@type"], "Person");
});
