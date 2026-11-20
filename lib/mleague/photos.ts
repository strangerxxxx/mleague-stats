import type { Game } from "./types";
import { photoObjectExists, publicPhotoUrl, savePhotoObject } from "./store";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export function photoFilename(src: string): string {
  try {
    const file = decodeURIComponent(new URL(src).pathname.split("/").pop() ?? "");
    const safe = file.replace(/[^a-zA-Z0-9._-]/g, "_");
    return safe || "photo.png";
  } catch {
    return "photo.png";
  }
}

export function replacePhotoUrls(games: Game[], map: Map<string, string>): Game[] {
  if (map.size === 0) return games;
  return games.map((game) => ({
    ...game,
    results: game.results.map((result) => {
      const photo = map.get(result.photo);
      const teamLogo = map.get(result.teamLogo);
      if (!photo && !teamLogo) return result;
      return {
        ...result,
        ...(photo ? { photo } : {}),
        ...(teamLogo ? { teamLogo } : {}),
      };
    }),
  }));
}

export function displayPhotoUrls(games: Game[]): string[] {
  const latest = new Map<string, string>();
  for (const game of games) {
    for (const result of game.results) {
      if (result.photo) latest.set(result.player, result.photo);
    }
  }
  return [...new Set(latest.values())];
}

export function displayLogoUrls(games: Game[]): string[] {
  const latest = new Map<string, string>();
  for (const game of games) {
    for (const result of game.results) {
      if (result.teamLogo) latest.set(result.team, result.teamLogo);
    }
  }
  return [...new Set(latest.values())];
}

export async function archiveMissingPhotos(games: Game[]): Promise<Game[]> {
  const urls = [...new Set([...displayPhotoUrls(games), ...displayLogoUrls(games)])];
  const map = new Map<string, string>();
  await mapPool(urls, 3, async (src) => {
    const resolved = await resolvePhotoUrl(src);
    if (resolved && resolved !== src) map.set(src, resolved);
  });
  if (map.size > 0) {
    console.info(`Archived ${map.size} missing player or team images`);
  }
  return replacePhotoUrls(games, map);
}

async function resolvePhotoUrl(src: string): Promise<string> {
  if (await urlOk(src)) return src;
  const filename = photoFilename(src);
  if (await photoObjectExists(filename)) {
    return publicPhotoUrl(filename);
  }
  const archived = await fetchWaybackImage(src);
  if (!archived) return src;
  const stored = await savePhotoObject(filename, archived.body, archived.contentType);
  return stored ?? archived.source;
}

async function fetchWaybackImage(
  src: string,
): Promise<{ body: Buffer; contentType: string; source: string } | null> {
  for (const timestamp of await waybackTimestamps(src)) {
    const source = `https://web.archive.org/web/${timestamp}id_/${src}`;
    try {
      const response = await fetch(source, {
        headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
      });
      if (!response.ok) continue;
      const body = Buffer.from(await response.arrayBuffer());
      if (!looksLikeImage(body)) continue;
      return {
        body,
        contentType: response.headers.get("content-type") || "image/png",
        source,
      };
    } catch {
      continue;
    }
  }
  return null;
}

function looksLikeImage(body: Buffer): boolean {
  if (body.length < 12) return false;
  if (body[0] === 0x89 && body[1] === 0x50) return true;
  if (body[0] === 0xff && body[1] === 0xd8) return true;
  if (body[0] === 0x47 && body[1] === 0x49) return true;
  return body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP";
}

async function waybackTimestamps(src: string): Promise<string[]> {
  const stamps: string[] = [];
  const available = await waybackAvailableTimestamp(src);
  if (available) stamps.push(available);
  const url =
    "https://web.archive.org/cdx/search/cdx?url=" +
    encodeURIComponent(src) +
    "&output=json&filter=statuscode:200&fl=timestamp&limit=5&sort=reverse";
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) {
      const rows = (await response.json()) as unknown;
      if (Array.isArray(rows)) {
        for (const row of rows.slice(1)) {
          const stamp = Array.isArray(row) ? String(row[0] ?? "") : "";
          if (/^\d{14}$/.test(stamp) && !stamps.includes(stamp)) stamps.push(stamp);
        }
      }
    }
  } catch {
    // Available API is enough when CDX is rate-limited.
  }
  return stamps;
}

async function waybackAvailableTimestamp(src: string): Promise<string | null> {
  const url = "https://archive.org/wayback/available?url=" + encodeURIComponent(src);
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      archived_snapshots?: { closest?: { available?: boolean; status?: string; timestamp?: string } };
    };
    const closest = data.archived_snapshots?.closest;
    if (!closest?.available || String(closest.status) !== "200") return null;
    const stamp = String(closest.timestamp ?? "");
    return /^\d{14}$/.test(stamp) ? stamp : null;
  } catch {
    return null;
  }
}

async function urlOk(src: string): Promise<boolean> {
  try {
    const response = await fetch(src, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  async function run() {
    while (index < items.length) {
      const current = index++;
      await worker(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
}
