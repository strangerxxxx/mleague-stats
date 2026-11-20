import type { Metadata } from "next";
import { formatPoints, formatRating } from "./format";
import { seasonLabel } from "./teams";
import { CAREER_SCOPE } from "./types";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://m-league.strn.jp").replace(
  /\/$/,
  "",
);
export const SITE_NAME = "Mリーグ レーティング";
export const SITE_DESCRIPTION =
  "Mリーグの試合結果から個人・チームの成績とレーティングを集計した非公式ファンサイトです。";

export function pageUrl(path = "/"): string {
  const normalized = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, `${SITE_URL}/`).href;
}

export function rankingPageHeading(selected: string, latestSeason: string): string {
  if (selected === CAREER_SCOPE) return "通算レーティング";
  if (selected === latestSeason) return SITE_NAME;
  return `${seasonLabel(selected)}のレーティング`;
}

export function homeSeoDescription(latestSeason: string): string {
  return `Mリーグ${seasonLabel(latestSeason)}の個人・チームレーティングと直近の対局結果を集計した非公式ファンサイトです。`;
}

export function careerSeoDescription(): string {
  return "Mリーグ開幕からの通算レーティングと個人・チーム成績を集計した非公式ファンサイトです。";
}

export function seasonSeoDescription(season: string): string {
  return `Mリーグ${seasonLabel(season)}の個人・チームレーティングと対局成績を集計した非公式ファンサイトです。`;
}

export function playerSeoDescription(player: {
  name: string;
  team: string;
  rating: number;
  career: { games: number; points: number };
}): string {
  return `${player.name}（${player.team}）の非公式レーティングは${formatRating(player.rating)}。通算${player.career.games}試合・${formatPoints(player.career.points)}の対局結果と年度別成績を掲載しています。`;
}

export function teamSeoDescription(team: {
  name: string;
  rating: number;
  career: { games: number; points: number };
  roster: { name: string }[];
}): string {
  const members = team.roster.map((player) => player.name).slice(0, 8).join("、");
  const memberPart = members ? `今シーズンの選手は${members}。` : "";
  return `${team.name}の非公式レーティングは${formatRating(team.rating)}。通算${team.career.games}試合・${formatPoints(team.career.points)}。${memberPart}出場選手ごとの対局結果を掲載しています。`;
}

export function pageMetadata(args: {
  title: string | { absolute: string };
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const titleText = typeof args.title === "string" ? args.title : args.title.absolute;
  const documentTitle = titleText === SITE_NAME ? SITE_NAME : `${titleText} | ${SITE_NAME}`;
  const url = pageUrl(args.path);
  const image = args.image || "/icon-512.png";
  return {
    title: args.title,
    description: args.description,
    alternates: { canonical: args.path },
    openGraph: {
      type: "website",
      locale: "ja_JP",
      siteName: SITE_NAME,
      title: documentTitle,
      description: args.description,
      url,
      images: [{ url: image, alt: titleText }],
    },
    twitter: {
      card: "summary",
      title: documentTitle,
      description: args.description,
      images: [image],
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: pageUrl("/"),
    inLanguage: "ja",
    description: SITE_DESCRIPTION,
  };
}

export function playerJsonLd(player: {
  name: string;
  slug: string;
  photo?: string;
  team: string;
  teamSlug: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: player.name,
    url: pageUrl(`/players/${player.slug}`),
    image: player.photo || undefined,
    description: player.description,
    memberOf: {
      "@type": "SportsTeam",
      name: player.team,
      url: pageUrl(`/teams/${player.teamSlug}`),
    },
  };
}

export function teamJsonLd(team: {
  name: string;
  slug: string;
  logo?: string;
  description: string;
  roster: { name: string; slug: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: team.name,
    sport: "Mahjong",
    url: pageUrl(`/teams/${team.slug}`),
    logo: team.logo || undefined,
    description: team.description,
    member: team.roster.map((player) => ({
      "@type": "Person",
      name: player.name,
      url: pageUrl(`/players/${player.slug}`),
    })),
  };
}
