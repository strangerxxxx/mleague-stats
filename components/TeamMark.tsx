import Image from "next/image";

export function TeamMark({
  src,
  name,
  color = "#888",
  size = 32,
}: {
  src?: string;
  name: string;
  color?: string;
  size?: number;
}) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) {
    return (
      <span
        className="team-mark-fallback"
        style={{ width: size, height: size, background: color }}
        aria-hidden
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={`${name} のアイコン`}
      width={size}
      height={size}
      className="team-mark"
      style={{ width: size, height: size }}
      unoptimized
      loading="lazy"
    />
  );
}

function resolveMediaUrl(src?: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return `https://m-league.jp${src.startsWith("/") ? src : `/${src}`}`;
}
