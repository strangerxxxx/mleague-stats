"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TeamMark } from "./TeamMark";

type SearchItem = {
  href: string;
  name: string;
  kind: "player" | "team";
  sub?: string;
  image?: string;
};

export function SearchBox({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 8);
    return items
      .filter((item) => `${item.name}${item.sub ?? ""}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [items, query]);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="site-search">
        選手・チームを検索
      </label>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) router.push(results[0].href);
        }}
      >
        <input
          id="site-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 180);
          }}
          placeholder="選手名・チーム名で検索"
          className="h-12 w-full rounded-full border border-[var(--line)] bg-[var(--bg-elev)] px-5 text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--gold)]"
        />
      </form>
      {open && results.length > 0 ? (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-[#12151f] shadow-2xl">
          {results.map((item) => (
            <li key={item.href}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5"
                onMouseDown={() => router.push(item.href)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  {item.kind === "team" ? (
                    <TeamMark src={item.image} name={item.name} size={24} />
                  ) : null}
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {item.kind === "player" ? item.sub ?? "選手" : "チーム"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
