import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-24 text-center">
      <h1 className="text-3xl font-bold">ページが見つかりません</h1>
      <p className="mt-3 text-[var(--muted)]">指定した選手・チームはデータにありません。</p>
      <Link href="/" className="mt-8 inline-block text-[var(--gold)] hover:underline">
        トップへ戻る
      </Link>
    </main>
  );
}
