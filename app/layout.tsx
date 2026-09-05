import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "같가가",
  description: "함께 장소를 모으고 추천과 이야기를 이어가는 공간",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
