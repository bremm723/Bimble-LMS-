"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space/api";

interface DashboardStats {
  totalCourses: number;
  totalEnrollments: number;
  completedMaterials: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ totalCourses: 0, totalEnrollments: 0, completedMaterials: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = useCallback(async (token: string) => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        fetch(`${API_URL}/courses`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
        fetch(`${API_URL}/courses/my`, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }),
      ]);
      const coursesData = coursesRes.ok ? await coursesRes.json() : { meta: { total: 0 } };
      const enrollData = enrollRes.ok ? await enrollRes.json() : { meta: { total: 0 }, data: [] };
      const enrollments = enrollData.data || [];
      const completed = enrollments.filter((e: { progress_pct: number }) => e.progress_pct >= 100).length;
      setStats({
        totalCourses: coursesData.meta?.total || 0,
        totalEnrollments: enrollData.meta?.total || 0,
        completedMaterials: completed,
      });
    } catch {}
    finally { setLoadingStats(false); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      fetchStats(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchStats]);

  async function handleLogout() {
    const token = localStorage.getItem("auth_token");
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch {}
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
  }

  if (!user) return null;

  const roleLabel: Record<string, string> = {
    super_admin: "Super Admin",
    admin_cabang: "Admin Cabang",
    tutor: "Tutor",
    siswa: "Siswa",
  };

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Selamat Pagi" : greetingHour < 17 ? "Selamat Siang" : "Selamat Malam";

  const statCards = [
    { label: "Total Kursus", value: loadingStats ? "..." : stats.totalCourses, icon: "📚", color: "from-blue-500 to-blue-600" },
    { label: "Kursus Diikuti", value: loadingStats ? "..." : stats.totalEnrollments, icon: "🎓", color: "from-green-500 to-green-600" },
    { label: "Kursus Selesai", value: loadingStats ? "..." : stats.completedMaterials, icon: "✅", color: "from-purple-500 to-purple-600" },
    { label: "Sertifikat", value: "—", icon: "🏆", color: "from-yellow-500 to-yellow-600" },
  ];

  const quickLinks = [
    { label: "Kursus Saya", href: "/my-courses", icon: "📖", desc: "Lanjutkan belajar" },
    { label: "Katalog Kursus", href: "/courses", icon: "📚", desc: "Jelajahi kursus" },
    { label: "Tagihan Saya", href: "/invoices", icon: "💳", desc: "Lihat & bayar tagihan" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFC72C]">
              <svg className="h-5 w-5 text-[#0A2540]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[#0A2540]">Bimbel LMS</span>
            <nav className="ml-6 flex gap-4">
              <a href="/my-courses" className="text-sm font-medium text-neutral-500 hover:text-[#0A2540] transition-colors">Kursus Saya</a>
              <a href="/courses" className="text-sm font-medium text-neutral-500 hover:text-[#0A2540] transition-colors">Semua Kursus</a>
              <a href="/invoices" className="text-sm font-medium text-neutral-500 hover:text-[#0A2540] transition-colors">Tagihan</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-700">{user.name}</p>
              <p className="text-xs text-neutral-500">{roleLabel[user.role] || user.role}</p>
            </div>
            <button onClick={handleLogout} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#0A2540] to-[#1a4a7a] p-6 text-white shadow-lg">
          <p className="text-sm font-medium text-white/70">{greeting},</p>
          <h1 className="mt-1 text-2xl font-bold">{user.name}! 👋</h1>
          <p className="mt-1 text-sm text-white/70">{roleLabel[user.role]} — Semangat belajar hari ini!</p>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5 flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-2xl shadow-sm`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-neutral-500">{stat.label}</p>
                <p className="text-2xl font-bold text-[#0A2540]">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="mt-8 text-lg font-bold text-[#0A2540]">Akses Cepat</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-[#FFC72C] transition-all"
            >
              <div className="text-3xl mb-3">{link.icon}</div>
              <p className="font-semibold text-[#0A2540] group-hover:text-[#0A2540]/80">{link.label}</p>
              <p className="text-sm text-neutral-500 mt-1">{link.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}

