import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bimbel - Platform Bimbingan Belajar Online",
  description:
    "Platform bimbingan belajar online terintegrasi. Kelas reguler, try out, olimpiade, dan LMS untuk semua jenjang.",
  openGraph: {
    title: "Bimbel - Platform Bimbingan Belajar Online",
    description:
      "Platform bimbingan belajar online terintegrasi untuk semua jenjang pendidikan.",
    type: "website",
  },
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
