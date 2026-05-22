import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NetDiag — ISPネットワーク構成図エディタ",
  description: "フィールドエンジニア向けネットワーク構成図作成ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, height: '100vh', overflow: 'hidden' }}>{children}</body>
    </html>
  );
}
