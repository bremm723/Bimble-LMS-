import React from "react";

interface PublicLayoutProps {
  children: React.ReactNode;
  navItems?: { label: string; href: string }[];
  logo?: string;
  brandName?: string;
}

export function PublicLayout({
  children,
  navItems = [],
  logo,
  brandName = "Bimbel",
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            {logo && (
              <img src={logo} alt={brandName} className="h-8 w-8 rounded-lg" />
            )}
            <span className="text-xl font-bold text-brand-navy">{brandName}</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-neutral-600 hover:text-brand-navy transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/login"
              className="text-sm font-medium text-brand-navy hover:text-brand-navy/80"
            >
              Masuk
            </a>
            <a
              href="/register"
              className="inline-flex items-center rounded-lg bg-brand-yellow px-4 py-2 text-sm font-semibold text-brand-navy hover:bg-brand-yellow/90 transition-colors"
            >
              Daftar Sekarang
            </a>
          </div>
          {/* Mobile menu button */}
          <button className="md:hidden text-brand-navy" aria-label="Open menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </nav>
      </header>

      {/* Main content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-brand-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-brand-yellow">{brandName}</h3>
              <p className="mt-2 text-sm text-neutral-300">
                Platform bimbingan belajar online terintegrasi.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Kontak
              </h4>
              <p className="mt-2 text-sm text-neutral-300">
                Hubungi kami untuk informasi lebih lanjut.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Ikuti Kami
              </h4>
              <p className="mt-2 text-sm text-neutral-300">
                Media sosial dan kanal resmi kami.
              </p>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-neutral-400">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
