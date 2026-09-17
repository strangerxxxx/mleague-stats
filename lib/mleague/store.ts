import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CachedGames } from "./types";

const CACHE_PATH = path.join(process.cwd(), "data", "games.json");

export async function loadCachedGames(): Promise<CachedGames | null> {
  const fromS3 = await loadFromS3();
  if (fromS3) return fromS3;
  const fromUrl = await loadFromUrl();
  if (fromUrl) return fromUrl;
  return loadFromFile();
}

export async function saveCachedGames(cache: CachedGames): Promise<void> {
  if (process.env.GAMES_S3_BUCKET) {
    await saveToS3(cache);
    return;
  }
  await mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache), "utf8");
}

async function loadFromFile(): Promise<CachedGames | null> {
  try {
    const raw = await readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw) as CachedGames;
  } catch {
    return null;
  }
}

async function loadFromUrl(): Promise<CachedGames | null> {
  const url = process.env.GAMES_DATA_URL;
  if (!url) return null;
  const response = await fetch(url, fetchInit(600));
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to load games data from ${url}: ${response.status}`);
  }
  return (await response.json()) as CachedGames;
}

async function loadFromS3(): Promise<CachedGames | null> {
  const bucket = process.env.GAMES_S3_BUCKET;
  if (!bucket) return null;
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({});
  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: gamesObjectKey(),
      }),
    );
    const raw = await result.Body?.transformToString();
    if (!raw) return null;
    return JSON.parse(raw) as CachedGames;
  } catch (error) {
    if (isMissingKey(error)) return null;
    throw error;
  }
}

async function saveToS3(cache: CachedGames): Promise<void> {
  const bucket = process.env.GAMES_S3_BUCKET;
  if (!bucket) return;
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({});
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: gamesObjectKey(),
      Body: JSON.stringify(cache),
      ContentType: "application/json; charset=utf-8",
      CacheControl: "public, max-age=60",
    }),
  );
}

function gamesObjectKey(): string {
  return process.env.GAMES_S3_KEY || "data/games.json";
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
