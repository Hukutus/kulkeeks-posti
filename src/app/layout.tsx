import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Posti Days",
  description: "Is Posti delivering mail today?",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
