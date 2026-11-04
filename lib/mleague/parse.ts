import * as cheerio from "cheerio";
import type { Game, GameResult, Rank, SeasonRef } from "./types";
import {
  currentSeasonId,
  displayTeamName,
  getTeamMeta,
  seasonIdFromStartYear,
  seasonLabel,
  teamFromLogoSrc,
  teamSlug,
} from "./teams";
import type { MatchCard, MatchCardTeam } from "./types";

const SITE = "https://m-league.jp";
const PLACEHOLDER = /選手|得点pt|^$/;

export function discoverSeasons(gamesIndexHtml: string): SeasonRef[] {
  const $ = cheerio.load(gamesIndexHtml);
  const found = new Map<string, SeasonRef>();

  $('a[href*="-season"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const match = href.match(/\/(?:games\/)?(\d{4})-season\/?/);
    if (!match) return;
    const startYear = Number(match[1]);
    const id = seasonIdFromStartYear(startYear);
    found.set(id, {
      id,
      label: $(el).text().trim() || seasonLabel(id),
      url: new URL(href, SITE).toString(),
      historical: true,
    });
  });

  const latest = currentSeasonId();
  if (!found.has(latest)) {
    found.set(latest, {
      id: latest,
      label: seasonLabel(latest),
      url: `${SITE}/games/`,
      historical: false,
    });
  } else {
    // Current season results live on /games/, not the historical archive.
    const current = found.get(latest);
    if (current) {
      current.historical = false;
      current.url = `${SITE}/games/`;
    }
  }

  return [...found.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function mergeDiscoveredSeasons(
  discovered: SeasonRef[],
  existing: { seasons?: SeasonRef[]; games?: { season: string }[] } | null,
): SeasonRef[] {
  const byId = new Map(discovered.map((season) => [season.id, season]));
  for (const season of existing?.seasons ?? []) {
    if (!byId.has(season.id)) {
      byId.set(season.id, { ...season, historical: true });
    }
  }
  for (const game of existing?.games ?? []) {
    if (byId.has(game.season)) continue;
    byId.set(game.season, {
      id: game.season,
      label: seasonLabel(game.season),
      url: `${SITE}/games/`,
      historical: true,
    });
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function currentSeasonMonthUrls(html: string, seasonId: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>([`${SITE}/games/`]);
  const startYear = Number(seasonId.slice(0, 4));

  $('a[href*="mly="]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const url = new URL(href, SITE);
    const year = Number(url.searchParams.get("mly") ?? "");
    if (!year) return;
    if (year === startYear || year === startYear + 1) {
      urls.add(`${SITE}/games/?mly=${year}&mlm=${url.searchParams.get("mlm")}`);
    }
  });

  if (urls.size === 1) {
    for (const month of [9, 10, 11, 12, 1, 2, 3, 4, 5]) {
      const year = month >= 9 ? startYear : startYear + 1;
      urls.add(`${SITE}/games/?mly=${year}&mlm=${month}`);
    }
  }

  return [...urls];
}

type OfficialGamePlayer = {
  name?: string | null;
  team?: string | null;
  teamImage?: string | null;
  image?: string | null;
  point?: number | null;
  rank?: number | null;
};

type OfficialGame = {
  date?: string;
  no?: number;
  desk?: number;
  complete?: boolean;
  players?: OfficialGamePlayer[];
};

export type OfficialGamesPayload = {
  games?: OfficialGame[];
};

export function parseOfficialGamesApi(payload: OfficialGamesPayload, season: string): Game[] {
  const games: Game[] = [];
  for (const item of payload.games ?? []) {
    if (!item.complete) continue;
    const date = tokyoDate(item.date ?? "");
    const round = Number(item.no);
    if (!date || !Number.isInteger(round) || round < 1) continue;
    const session = Number.isInteger(Number(item.desk)) ? Number(item.desk) : 0;
    const results: GameResult[] = [];
    for (const player of item.players ?? []) {
      const name = (player.name ?? "").replace(/\s+/g, "").trim();
      const rank = Number(player.rank) as Rank;
      const points = Number(player.point);
      if (!name || PLACEHOLDER.test(name) || !Number.isFinite(points) || ![1, 2, 3, 4].includes(rank)) {
        continue;
      }
      results.push({
        rank,
        player: name,
        team: displayTeamName(player.team ?? ""),
        points,
        photo: absoluteUrl(player.image ?? ""),
        teamLogo: absoluteUrl(player.teamImage ?? ""),
      });
    }
    if (results.length !== 4) continue;
    games.push({
      id: `${date.replaceAll("-", "")}-${session}-${round}`,
      season,
      date,
      session,
      round,
      results,
    });
  }
  return fillMissingTeams(games);
}

export function parseOfficialMatchCards(
  payload: OfficialGamesPayload,
  season: string,
): MatchCard[] {
  const cards = new Map<string, MatchCard>();
  for (const item of payload.games ?? []) {
    if (item.complete) continue;
    const date = tokyoDate(item.date ?? "");
    if (!date) continue;
    const desk = Number.isInteger(Number(item.desk)) ? Number(item.desk) : 0;
    const teams: MatchCardTeam[] = [];
    const seen = new Set<string>();
    for (const player of item.players ?? []) {
      const name = displayTeamName((player.team ?? "").trim());
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const meta = getTeamMeta(name);
      teams.push({
        name,
        slug: meta?.slug ?? teamSlug(name),
        logo: absoluteUrl(player.teamImage ?? ""),
      });
    }
    if (teams.length !== 4) continue;
    const id = `${date.replaceAll("-", "")}-${desk}`;
    if (!cards.has(id)) {
      cards.set(id, { id, date, season, desk, teams });
    }
  }
  return [...cards.values()].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.desk - b.desk;
  });
}

export function currentSeasonRefreshUrls(now = new Date()): string[] {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const previous = new Date(year, month - 2, 1);
  return [
    ...new Set([
      `${SITE}/games/`,
      `${SITE}/games/?mly=${year}&mlm=${month}`,
      `${SITE}/games/?mly=${previous.getFullYear()}&mlm=${previous.getMonth() + 1}`,
    ]),
  ];
}

export function parseGamesHtml(html: string, season: string): Game[] {
  const $ = cheerio.load(html);
  const logoMap = buildLogoMap($);
  const games: Game[] = [];

  $('div.c-modal2[id^="js-modal-key"]').each((_, modal) => {
    const id = $(modal).attr("id") ?? "";
    const parsed = parseModalKey(id);
    if (!parsed) return;

    $(modal)
      .find(".p-gamesResult__column")
      .each((roundIndex, column) => {
        const results: GameResult[] = [];
        $(column)
          .find(".p-gamesResult__rank-item")
          .each((__, item) => {
            const name = $(item).find(".p-gamesResult__name").text().replace(/\s+/g, "").trim();
            const pointText = $(item).find(".p-gamesResult__point").text().trim();
            const points = parsePoints(pointText);
            const rankText = $(item).find(".p-gamesResult__rank-badge").text().trim();
            const rank = Number(rankText) as Rank;
            const photo = $(item).find(".p-gamesResult__thumbnail img").attr("src") ?? "";
            const teamLogo = $(item).find(".p-gamesResult__team-badge img").attr("src") ?? "";
            if (!name || PLACEHOLDER.test(name) || points === null || ![1, 2, 3, 4].includes(rank)) {
              return;
            }
            results.push({
              rank,
              player: name,
              team: displayTeamName(teamFromLogoSrc(teamLogo, logoMap)),
              points,
              photo: absoluteUrl(photo),
              teamLogo: absoluteUrl(teamLogo),
            });
          });

        if (results.length !== 4) return;
        games.push({
          id: `${parsed.date}-${parsed.session}-${roundIndex + 1}`,
          season,
          date: toIsoDate(parsed.date),
          session: parsed.session,
          round: roundIndex + 1,
          results,
        });
      });
  });

  return fillMissingTeams(games);
}

function buildLogoMap($: cheerio.CheerioAPI): Map<string, string> {
  const map = new Map<string, string>();
  $("img[alt]").each((_, el) => {
    const alt = ($(el).attr("alt") ?? "").trim();
    const src = $(el).attr("src") ?? "";
    if (!alt || !src) return;
    if (!isLikelyTeamName(alt)) return;
    const file = src.split("/").pop()?.split("?")[0] ?? src;
    map.set(file, alt);
    map.set(src, alt);
  });
  return map;
}

function isLikelyTeamName(alt: string): boolean {
  return Boolean(
    alt.includes("ドリブンズ") ||
      alt.includes("風林火山") ||
      alt.includes("サクラナイツ") ||
      alt.includes("格闘倶楽部") ||
      alt.includes("ABEMAS") ||
      alt.includes("フェニックス") ||
      alt.includes("雷電") ||
      alt.includes("RAIDEN") ||
      alt.includes("BEAST") ||
      alt.includes("Japanext") ||
      alt.includes("Pirates") ||
      alt.includes("JETS") ||
      alt.includes("パイレーツ"),
  );
}

function parseModalKey(id: string): { date: string; session: number } | null {
  const match = id.match(/key(\d{8})(?:-(\d+))?/);
  if (!match) return null;
  return { date: match[1], session: Number(match[2] ?? 0) };
}

function toIsoDate(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

function tokyoDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) return "";
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function absoluteUrl(src: string): string {
  if (!src) return "";
  try {
    return new URL(src, SITE).toString();
  } catch {
    return src;
  }
}

export function parsePoints(text: string): number | null {
  const normalized = text
    .replace(/\s+/g, "")
    .replace(/pt$/i, "")
    .replace(/ＰＴ$/i, "")
    .replace(/▲|△|−|–/g, "-")
    .replace(/,/g, "");
  if (!normalized || PLACEHOLDER.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function fillMissingTeams(games: Game[]): Game[] {
  const byPlayerSeason = new Map<string, Map<string, number>>();
  for (const game of games) {
    for (const result of game.results) {
      if (!result.team) continue;
      const key = `${game.season}::${result.player}`;
      const counts = byPlayerSeason.get(key) ?? new Map<string, number>();
      counts.set(result.team, (counts.get(result.team) ?? 0) + 1);
      byPlayerSeason.set(key, counts);
    }
  }

  const byPlayer = new Map<string, Map<string, number>>();
  for (const game of games) {
    for (const result of game.results) {
      if (!result.team) continue;
      const counts = byPlayer.get(result.player) ?? new Map<string, number>();
      counts.set(result.team, (counts.get(result.team) ?? 0) + 1);
      byPlayer.set(result.player, counts);
    }
  }

  function pickTeam(player: string, season: string): string {
    const seasonCounts = byPlayerSeason.get(`${season}::${player}`);
    if (seasonCounts && seasonCounts.size > 0) {
      return [...seasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
    }
    const careerCounts = byPlayer.get(player);
    if (!careerCounts || careerCounts.size === 0) return "";
    return [...careerCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }

  return games.map((game) => ({
    ...game,
    results: game.results.map((result) => {
      if (result.team) return result;
      return { ...result, team: pickTeam(result.player, game.season) };
    }),
  }));
}

export function mergeGames(groups: Game[][]): Game[] {
  const map = new Map<string, Game>();
  for (const games of groups) {
    for (const game of games) {
      const prev = map.get(game.id);
      if (prev) {
        const prevFilled = prev.results.filter((result) => result.team).length;
        const nextFilled = game.results.filter((result) => result.team).length;
        if (nextFilled < prevFilled) continue;
      }
      map.set(game.id, game);
    }
  }
  return fillMissingTeams([...map.values()]);
}
