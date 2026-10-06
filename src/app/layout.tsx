import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "リリース管理",
  description: "楽曲配信リリースのスケジュール管理",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
