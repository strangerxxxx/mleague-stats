import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { buildSiteSnapshot, isSiteSnapshot, type SiteSnapshot } from "./site";
import {
  SNAPSHOT_VERSION,
  type CachedGames,
  type ComputedProfiles,
  type Dataset,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_REVALIDATE_SECONDS = 180;
const MEMORY_TTL_MS = DATA_REVALIDATE_SECONDS * 1000;

type JsonName = "games.json" | "site.json" | "dataset.json";

const urlMemory = new Map<string, { expiresAt: number; data: unknown }>();

export async function loadCachedGames(): Promise<CachedGames | null> {
  return loadJson<CachedGames>("games.json");
}

export async function loadSiteSnapshot(): Promise<SiteSnapshot | null> {
  const data = await loadJson<unknown>("site.json");
  return isSiteSnapshot(data) ? data : null;
}

export async function loadComputedProfiles(): Promise<ComputedProfiles | null> {
  const data = await loadJson<unknown>("dataset.json");
  return isComputedProfiles(data) ? data : null;
}

export async function saveCachedGames(cache: CachedGames): Promise<void> {
  await saveJson("games.json", cache);
}

export async function saveComputedDataset(dataset: Dataset): Promise<void> {
  await saveJson("site.json", buildSiteSnapshot(dataset));
  await saveJson("dataset.json", toComputedProfiles(dataset));
}

function toComputedProfiles(dataset: Dataset): ComputedProfiles {
  return {
    version: SNAPSHOT_VERSION,
    fetchedAt: dataset.fetchedAt,
    source: dataset.source,
    seasons: dataset.seasons,
    latestSeason: dataset.latestSeason,
    players: dataset.players,
    teams: dataset.teams,
  };
}

function isComputedProfiles(value: unknown): value is ComputedProfiles {
  if (!value || typeof value !== "object") return false;
  const profiles = value as ComputedProfiles;
  return (
    profiles.version === SNAPSHOT_VERSION &&
    typeof profiles.fetchedAt === "string" &&
    typeof profiles.latestSeason === "string" &&
    Array.isArray(profiles.seasons) &&
    Array.isArray(profiles.players) &&
    Array.isArray(profiles.teams)
  );
}

async function loadJson<T>(name: JsonName): Promise<T | null> {
  const fromS3 = await loadFromS3<T>(name);
  if (fromS3) return fromS3;
  const fromUrl = await loadFromUrl<T>(name);
  if (fromUrl) return fromUrl;
  return loadFromFile<T>(name);
}

async function saveJson(name: JsonName, data: unknown): Promise<void> {
  if (process.env.GAMES_S3_BUCKET) {
    await saveToS3(name, data);
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(filePath(name), JSON.stringify(data), "utf8");
}

async function loadFromFile<T>(name: JsonName): Promise<T | null> {
  try {
    const raw = await readFile(filePath(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function loadFromUrl<T>(name: JsonName): Promise<T | null> {
  const url = dataUrl(name);
  if (!url) return null;
  const cached = urlMemory.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }
  const response = await fetch(url, fetchInit(DATA_REVALIDATE_SECONDS));
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load ${name} from ${url}: ${response.status}`);
  }
  const data = (await response.json()) as T;
  urlMemory.set(url, { expiresAt: Date.now() + MEMORY_TTL_MS, data });
  return data;
}

async function loadFromS3<T>(name: JsonName): Promise<T | null> {
  const bucket = process.env.GAMES_S3_BUCKET;
  if (!bucket) return null;
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({});
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: objectKey(name),
      }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes || bytes.length === 0) return null;
    return parseJsonBody<T>(Buffer.from(bytes), result.ContentEncoding);
  } catch (error) {
    if (isMissingKey(error)) return null;
    throw error;
  }
}

async function saveToS3(name: JsonName, data: unknown): Promise<void> {
  const bucket = process.env.GAMES_S3_BUCKET;
  if (!bucket) return;
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({});
  const body = gzipSync(Buffer.from(JSON.stringify(data)));
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey(name),
      Body: body,
      ContentType: "application/json; charset=utf-8",
      ContentEncoding: "gzip",
      CacheControl: `public, max-age=${DATA_REVALIDATE_SECONDS}`,
    }),
  );
}

function parseJsonBody<T>(buf: Buffer, encoding?: string): T {
  const gzipped =
    encoding === "gzip" || (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b);
  const raw = gzipped ? gunzipSync(buf).toString("utf8") : buf.toString("utf8");
  return JSON.parse(raw) as T;
}

function objectKey(name: JsonName): string {
  const gamesKey = process.env.GAMES_S3_KEY || "data/games.json";
  if (name === "games.json") return gamesKey;
  if (gamesKey.endsWith("games.json")) {
    return `${gamesKey.slice(0, -"games.json".length)}${name}`;
  }
  return `data/${name}`;
}

function dataUrl(name: JsonName): string | null {
  const gamesUrl = process.env.GAMES_DATA_URL;
  if (!gamesUrl) return null;
  if (name === "games.json") return gamesUrl;
  if (gamesUrl.includes("games.json")) {
    return gamesUrl.replace(/games\.json(?:\?.*)?$/, name);
  }
  return gamesUrl.replace(/\/?$/, "/").replace(/[^/]+\/?$/, name);
}

function filePath(name: JsonName): string {
  return path.join(DATA_DIR, name);
}

function isMissingKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "NoSuchKey" || error.name === "NotFound")
  );
}

function fetchInit(revalidateSeconds: number): RequestInit {
  const headers = { Accept: "application/json" };
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return { headers, cache: "no-store" };
  }
  return { headers, next: { revalidate: revalidateSeconds } } as RequestInit;
}
