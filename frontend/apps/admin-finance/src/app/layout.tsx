import type { Metadata } from "next";
import "./globals.css";
import { AdminLayoutWrapper } from "../components/AdminLayoutWrapper";

export const metadata: Metadata = {
  title: "Bimbel Admin - Administrasi & Keuangan",
  description: "Dashboard administrasi dan keuangan platform Bimbel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <AdminLayoutWrapper>{children}</AdminLayoutWrapper>
      </body>
    </html>
  );
}
