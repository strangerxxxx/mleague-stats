import Link from "next/link";
import { seasonLabel } from "@/lib/mleague/teams";
import { CAREER_SCOPE } from "@/lib/mleague/types";

export function SeasonSwitcher({
  seasons,
  latestSeason,
  selected,
}: {
  seasons: string[];
  latestSeason: string;
  selected: string;
}) {
  const past = [...seasons].filter((id) => id !== latestSeason).reverse();
  const items = [
    { id: latestSeason, label: "今シーズン", href: "/" },
    { id: CAREER_SCOPE, label: "通算", href: "/?season=career" },
    ...past.map((id) => ({
      id,
      label: seasonLabel(id),
      href: `/?season=${encodeURIComponent(id)}`,
    })),
  ];

  return (
    <nav className="flex flex-wrap gap-2" aria-label="シーズン切り替え">
      {items.map((item) => {
        const active = selected === item.id;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              active
                ? "border-[var(--gold)] bg-[var(--gold)] text-[#2a1d00]"
                : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
