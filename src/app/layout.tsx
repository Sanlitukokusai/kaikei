import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kaikei Cloud — 会計クラウド",
  description: "日本の中小企業のための会計 SaaS。複式簿記から決算書まで、一つのクラウドで。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
