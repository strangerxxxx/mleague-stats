import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const noto = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mリーグ レーティング",
    template: "%s | Mリーグ レーティング",
  },
  description:
    "Mリーグの試合結果から個人・チームの成績とレーティングを集計した非公式サイトです。",
};

export const revalidate = 3600;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${noto.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[var(--line)] px-5 py-8 text-center text-sm text-[var(--muted)]">
          こちらのデータは非公式です。
        </footer>
      </body>
    </html>
  );
}
