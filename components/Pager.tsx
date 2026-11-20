import Link from "next/link";
import { pageTokens } from "@/lib/mleague/history";

export function Pager({
  current,
  pageCount,
  total,
  hrefFor,
}: {
  current: number;
  pageCount: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const tokens = pageTokens(current, pageCount);

  return (
    <nav
      aria-label="対局結果のページ送り"
      className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[var(--muted)]">{total}試合</p>
      <div className="flex flex-wrap items-center gap-1">
        <PagerControl href={current > 1 ? hrefFor(current - 1) : undefined} rel="prev">
          ←
        </PagerControl>
        {tokens.map((token) =>
          token.kind === "ellipsis" ? (
            <span
              key={token.id}
              aria-hidden
              className="inline-flex h-9 min-w-9 items-center justify-center text-[var(--muted)]"
            >
              …
            </span>
          ) : token.page === current ? (
            <span
              key={token.page}
              aria-current="page"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-[var(--gold)] px-2 text-sm font-bold text-[#2a1d00]"
            >
              {token.page}
            </span>
          ) : (
            <Link
              key={token.page}
              href={hrefFor(token.page)}
              aria-label={`${token.page}ページ`}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--line)] px-2 text-sm text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]"
            >
              {token.page}
            </Link>
          ),
        )}
        <PagerControl href={current < pageCount ? hrefFor(current + 1) : undefined} rel="next">
          →
        </PagerControl>
      </div>
    </nav>
  );
}

function PagerControl({
  href,
  rel,
  children,
}: {
  href?: string;
  rel: "prev" | "next";
  children: string;
}) {
  const className =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-[var(--line)] px-2 text-sm";
  if (!href) {
    return (
      <span aria-disabled="true" className={`${className} text-[var(--muted)]/40`}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      rel={rel}
      aria-label={rel === "prev" ? "前のページ" : "次のページ"}
      className={`${className} text-[var(--muted)] hover:border-[var(--gold)] hover:text-[var(--gold)]`}
    >
      {children}
    </Link>
  );
}
