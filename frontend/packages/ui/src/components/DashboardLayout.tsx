"use client";

import React, { useState } from "react";

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
  badge?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  userName?: string;
  userRole?: string;
  brandName?: string;
  onLogout?: () => void;
}

export function DashboardLayout({
  children,
  sidebarItems,
  userName = "User",
  userRole = "Siswa",
  brandName = "Bimbel",
  onLogout,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-brand-navy text-white transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center gap-2 border-b border-white/10 px-6 py-4">
            <span className="text-lg font-bold text-brand-yellow">{brandName}</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {item.icon && <span className="h-5 w-5 flex-shrink-0">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-xs font-semibold text-brand-navy">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info */}
          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-brand-yellow flex items-center justify-center text-sm font-bold text-brand-navy">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">{userName}</p>
                <p className="truncate text-xs text-white/50">{userRole}</p>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-white/50 hover:text-white"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-brand-navy lg:hidden"
            aria-label="Open sidebar"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-600">{userName}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
