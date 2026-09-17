export type TeamMeta = {
  slug: string;
  name: string;
  shortName: string;
  color: string;
  aliases: string[];
};

const PRESERVED_TEAM_NAMES = new Set(["BEAST Japanext"]);

export const TEAMS: TeamMeta[] = [
  {
    slug: "earth-jets",
    name: "EARTH JETS",
    shortName: "ジェッツ",
    color: "#1fa37a",
    aliases: ["EARTH JETS", "アースジェッツ", "ジェッツ"],
  },
  {
    slug: "akasaka-drivens",
    name: "赤坂ドリブンズ",
    shortName: "ドリブンズ",
    color: "#d32f2f",
    aliases: ["赤坂ドリブンズ", "ドリブンズ"],
  },
  {
    slug: "ex-furinkazan",
    name: "EX風林火山",
    shortName: "風林火山",
    color: "#ef6c00",
    aliases: ["EX風林火山", "風林火山"],
  },
  {
    slug: "sakura-knights",
    name: "KADOKAWAサクラナイツ",
    shortName: "サクラナイツ",
    color: "#c2185b",
    aliases: ["KADOKAWAサクラナイツ", "サクラナイツ"],
  },
  {
    slug: "konami-mfc",
    name: "KONAMI麻雀格闘倶楽部",
    shortName: "格闘倶楽部",
    color: "#1565c0",
    aliases: [
      "KONAMI麻雀格闘倶楽部",
      "KONAMI 麻雀格闘倶楽部",
      "麻雀格闘倶楽部",
      "格闘倶楽部",
    ],
  },
  {
    slug: "shibuya-abemas",
    name: "渋谷ABEMAS",
    shortName: "ABEMAS",
    color: "#00838f",
    aliases: ["渋谷ABEMAS", "ABEMAS"],
  },
  {
    slug: "sega-phoenix",
    name: "セガサミーフェニックス",
    shortName: "フェニックス",
    color: "#f9a825",
    aliases: ["セガサミーフェニックス", "フェニックス"],
  },
  {
    slug: "raiden",
    name: "TEAM RAIDEN / 雷電",
    shortName: "雷電",
    color: "#7b1fa2",
    aliases: ["TEAM RAIDEN / 雷電", "TEAM RAIDEN/雷電", "雷電"],
  },
  {
    slug: "beast-x",
    name: "BEAST X",
    shortName: "BEAST X",
    color: "#6d1a1a",
    aliases: ["BEAST X", "BEAST Japanext", "Japanext"],
  },
  {
    slug: "pirates",
    name: "U-NEXT Pirates",
    shortName: "パイレーツ",
    color: "#455a64",
    aliases: ["U-NEXT Pirates", "U-NEXTパイレーツ", "パイレーツ"],
  },
];

const byAlias = new Map<string, TeamMeta>();
for (const team of TEAMS) {
  byAlias.set(team.name, team);
  byAlias.set(team.slug, team);
  for (const alias of team.aliases) {
    byAlias.set(alias, team);
    byAlias.set(alias.replace(/\s+/g, ""), team);
  }
}

export function normalizeTeamName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const meta = byAlias.get(trimmed) ?? byAlias.get(trimmed.replace(/\s+/g, ""));
  return meta?.name ?? trimmed;
}

export function displayTeamName(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (PRESERVED_TEAM_NAMES.has(trimmed)) return trimmed;
  return normalizeTeamName(trimmed);
}

export function getTeamMeta(nameOrSlug: string): TeamMeta | undefined {
  const key = nameOrSlug.trim();
  return byAlias.get(key) ?? byAlias.get(key.replace(/\s+/g, ""));
}

export function teamSlug(name: string): string {
  return getTeamMeta(name)?.slug ?? slugify(name);
}

export function slugify(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

export function deslugify(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

const LOGO_FILE_TEAMS: Record<string, string> = {
  "1.png": "赤坂ドリブンズ",
  "2.png": "EX風林火山",
  "3.png": "KONAMI麻雀格闘倶楽部",
  "4.png": "渋谷ABEMAS",
  "5.png": "セガサミーフェニックス",
  "6.png": "TEAM RAIDEN / 雷電",
  "7.png": "U-NEXT Pirates",
  "konami.png": "KONAMI麻雀格闘倶楽部",
  "pirates_500_500.png": "U-NEXT Pirates",
  "jets.png": "EARTH JETS",
  "beast-1.png": "BEAST Japanext",
  "beast-2.png": "BEAST X",
  "a11b4bb3ba448d1fa402ac3dc62cc91f.png": "KADOKAWAサクラナイツ",
  "52c9b092657b12cf62a56804592356f3.png": "KADOKAWAサクラナイツ",
  "622c11b3faa22508d2346230026d07a6.png": "KADOKAWAサクラナイツ",
  "sakura_tate_gray_25.png": "KADOKAWAサクラナイツ",
  "46a57748c4324ad77b98522bd82cb42e-1.png": "U-NEXT Pirates",
  "ex_fu-rinkazan.png": "EX風林火山",
};

export function teamFromLogoSrc(
  src: string,
  logoMap?: Map<string, string>,
): string {
  if (!src) return "";
  const file = src.split("/").pop()?.split("?")[0] ?? "";
  const mapped = logoMap?.get(file) ?? logoMap?.get(src);
  if (mapped) return displayTeamName(mapped);

  const known = LOGO_FILE_TEAMS[file];
  if (known) return known;

  const lower = file.toLowerCase();
  if (lower.includes("jet")) return "EARTH JETS";
  if (lower.includes("pirate")) return "U-NEXT Pirates";
  if (lower.includes("konami")) return "KONAMI麻雀格闘倶楽部";
  if (lower.includes("beast")) return "BEAST X";
  if (lower.includes("sakura")) return "KADOKAWAサクラナイツ";
  if (lower.includes("fu-rinkazan") || lower.includes("furinkazan")) {
    return "EX風林火山";
  }
  return "";
}

export function currentSeasonId(now = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = month >= 9 ? year : year - 1;
  return seasonIdFromStartYear(start);
}

export function seasonIdFromStartYear(startYear: number): string {
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}

export function seasonLabel(seasonId: string): string {
  return `${seasonId}シーズン`;
}
