import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Travel Board",
  description: "Structured AI itinerary planning board for editable trip plans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
