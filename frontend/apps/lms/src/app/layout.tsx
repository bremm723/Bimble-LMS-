import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bimbel LMS - Learning Management System",
  description: "Platform pembelajaran online Bimbel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
