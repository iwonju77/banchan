import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "飯饌 오늘반찬",
  description: "오늘의 반찬을 준비하고 있습니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
