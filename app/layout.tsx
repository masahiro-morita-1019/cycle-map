import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cycle Map — シェアサイクル横断検索",
  description:
    "HELLO CYCLING・ドコモバイクシェアを横断して、今この瞬間の借りられる/返せるポートを地図で探せるWebアプリ。",
  openGraph: {
    title: "Cycle Map",
    description: "シェアサイクルを横断して地図から探せるWebアプリ",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0b0d10",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
