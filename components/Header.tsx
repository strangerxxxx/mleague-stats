import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[#07080d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.svg" alt="Mリーグ" width={32} height={32} className="h-8 w-8" />
          <span className="text-lg font-bold tracking-[0.18em] text-[var(--gold)]">M.STATS</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          <Link className="hover:text-[var(--gold)]" href="/#recent">
            直近
          </Link>
          <Link className="hover:text-[var(--gold)]" href="/#players">
            個人
          </Link>
          <Link className="hover:text-[var(--gold)]" href="/#teams">
            チーム
          </Link>
        </nav>
      </div>
    </header>
  );
}
