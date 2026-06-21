import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Travel Board",
  description: "여행 조건을 일정과 장소, 지도까지 하나의 보드로 정리하는 여행 플래너.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script>{`(() => {
          try {
            const saved = localStorage.getItem("ai-travel-board-theme");
            const theme = saved === "dark" || (!saved && matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
            document.documentElement.dataset.theme = theme;
          } catch { /* Use the light theme when storage is unavailable. */ }
        })();`}</script>
      </head>
      <body>{children}</body>
    </html>
  );
}
