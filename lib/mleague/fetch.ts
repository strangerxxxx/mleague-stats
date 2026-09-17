import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Game, SeasonRef } from "./types";
import {
  currentSeasonMonthUrls,
  discoverSeasons,
  mergeGames,
  parseGamesHtml,
} from "./parse";
import { currentSeasonId, seasonLabel } from "./teams";

const GAMES_INDEX = "https://m-league.jp/games/";
const CACHE_PATH = path.join(process.cwd(), "data", "games.json");
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type CachedGames = {
  fetchedAt: string;
  source: string;
  seasons: SeasonRef[];
  games: Game[];
};

export async function fetchHtml(url: string, revalidateSeconds = 3600): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.8",
    },
    next: { revalidate: revalidateSeconds },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

export async function loadCachedGames(): Promise<CachedGames | null> {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw) as CachedGames;
  } catch {
    return null;
  }
}

export async function saveCachedGames(cache: CachedGames): Promise<void> {
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), "utf8");
}

export async function fetchAllGames(options?: {
  refreshAll?: boolean;
  persist?: boolean;
  maxAgeMs?: number;
}): Promise<CachedGames> {
  const existing = options?.refreshAll ? null : await loadCachedGames();
  const maxAgeMs = options?.maxAgeMs ?? 10 * 60 * 1000;
  if (
    existing &&
    maxAgeMs > 0 &&
    Date.now() - new Date(existing.fetchedAt).getTime() < maxAgeMs
  ) {
    return existing;
  }
  const indexHtml = await fetchHtml(GAMES_INDEX, 1800);
  const seasons = ensureCurrentSeason(discoverSeasons(indexHtml));
  const latest = seasons.at(-1)?.id ?? currentSeasonId();

  const htmlGroups: Game[][] = [];
  const cachedBySeason = groupBySeason(existing?.games ?? []);

  for (const season of seasons) {
    if (season.historical && cachedBySeason.has(season.id) && !options?.refreshAll) {
      htmlGroups.push(cachedBySeason.get(season.id) ?? []);
      continue;
    }

    console.info(`Fetching ${season.id} from ${season.url}`);

    if (season.historical) {
      const html = await fetchHtml(season.url, 60 * 60 * 24 * 7);
      htmlGroups.push(parseGamesHtml(html, season.id));
      continue;
    }

    const monthUrls = currentSeasonMonthUrls(indexHtml, season.id);
    const monthGames = await mapPool(monthUrls, 3, async (url) => {
      try {
        const html = await fetchHtml(url, 1800);
        return parseGamesHtml(html, season.id);
      } catch {
        return [] as Game[];
      }
    });
    htmlGroups.push(mergeGames(monthGames));
  }

  const games = mergeGames(htmlGroups).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.session !== b.session) return a.session - b.session;
    return a.round - b.round;
  });

  const cache: CachedGames = {
    fetchedAt: new Date().toISOString(),
    source: GAMES_INDEX,
    seasons: seasons.map((season) =>
      season.id === latest ? { ...season, historical: false } : season,
    ),
    games,
  };
  if (options?.persist !== false) {
    try {
      await saveCachedGames(cache);
    } catch (error) {
      console.warn("Could not persist games cache", error);
    }
  }
  return cache;
}

function ensureCurrentSeason(seasons: SeasonRef[]): SeasonRef[] {
  const latest = currentSeasonId();
  if (seasons.some((season) => season.id === latest)) return seasons;
  return [
    ...seasons,
    {
      id: latest,
      label: seasonLabel(latest),
      url: GAMES_INDEX,
      historical: false,
    },
  ];
}

function groupBySeason(games: Game[]): Map<string, Game[]> {
  const map = new Map<string, Game[]>();
  for (const game of games) {
    const list = map.get(game.season) ?? [];
    list.push(game);
    map.set(game.season, list);
  }
  return map;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
