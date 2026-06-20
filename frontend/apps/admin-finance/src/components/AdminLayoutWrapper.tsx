"use client";

import { useEffect, useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [isAuthPage, setIsAuthPage] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const path = window.location.pathname;
    setIsAuthPage(path === "/login" || path === "/");
  }, []);

  if (!mounted) return <>{children}</>;

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
