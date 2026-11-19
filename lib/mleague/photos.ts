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
      return photo ? { ...result, photo } : result;
    }),
  }));
}

export async function archiveMissingPhotos(games: Game[]): Promise<Game[]> {
  const urls = [...new Set(games.flatMap((game) => game.results.map((result) => result.photo)))].filter(
    Boolean,
  );
  const map = new Map<string, string>();
  await mapPool(urls, 4, async (src) => {
    const resolved = await resolvePhotoUrl(src);
    if (resolved && resolved !== src) map.set(src, resolved);
  });
  if (map.size > 0) {
    console.info(`Archived ${map.size} missing player photos`);
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
  const timestamp = await latestWaybackTimestamp(src);
  if (!timestamp) return null;
  const source = `https://web.archive.org/web/${timestamp}id_/${src}`;
  const response = await fetch(source, {
    headers: { "User-Agent": USER_AGENT, Accept: "image/*" },
  });
  if (!response.ok) return null;
  const body = Buffer.from(await response.arrayBuffer());
  if (!looksLikeImage(body)) return null;
  return {
    body,
    contentType: response.headers.get("content-type") || "image/png",
    source,
  };
}

function looksLikeImage(body: Buffer): boolean {
  if (body.length < 12) return false;
  if (body[0] === 0x89 && body[1] === 0x50) return true;
  if (body[0] === 0xff && body[1] === 0xd8) return true;
  if (body[0] === 0x47 && body[1] === 0x49) return true;
  return body.subarray(0, 4).toString("ascii") === "RIFF" && body.subarray(8, 12).toString("ascii") === "WEBP";
}

async function latestWaybackTimestamp(src: string): Promise<string | null> {
  const url =
    "https://web.archive.org/cdx/search/cdx?url=" +
    encodeURIComponent(src) +
    "&output=json&filter=statuscode:200&fl=timestamp&limit=20";
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) return null;
  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const stamps = rows
    .slice(1)
    .map((row) => (Array.isArray(row) ? String(row[0] ?? "") : ""))
    .filter((value) => /^\d{14}$/.test(value));
  return stamps.at(-1) ?? null;
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
