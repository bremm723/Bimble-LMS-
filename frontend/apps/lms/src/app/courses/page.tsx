"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  status: string;
  thumbnail: string | null;
  tutor?: { id: number; name: string };
  chapters?: { id: number; title: string; materials?: unknown[] }[];
}

export default function CoursesPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchCourses = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat kursus");
      const data = await res.json();
      setCourses(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      fetchCourses(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchCourses]);

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

  const isAdminOrTutor = ["super_admin", "admin_cabang", "tutor"].includes(user.role);
  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  const levelColors: Record<string, string> = {
    SD: "bg-green-50 text-green-700",
    SMP: "bg-blue-50 text-blue-700",
    SMA: "bg-purple-50 text-purple-700",
  };

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
              <a href="/courses" className="text-sm font-semibold text-[#0A2540] border-b-2 border-[#FFC72C] pb-0.5">Semua Kursus</a>
              <a href="/invoices" className="text-sm font-medium text-neutral-500 hover:text-[#0A2540] transition-colors">Tagihan</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium text-neutral-700">{user.name}</p>
            <button onClick={handleLogout} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0A2540]">Katalog Kursus</h1>
            <p className="mt-1 text-neutral-600">Jelajahi semua kursus yang tersedia.</p>
          </div>
          {isAdminOrTutor && (
            <button
              onClick={() => alert("Form buat kursus akan segera tersedia.")}
              className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2540]/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Buat Kursus
            </button>
          )}
        </div>

        {/* Search */}
        <div className="mt-6 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari kursus atau mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-neutral-300 pl-9 pr-4 py-2.5 text-sm focus:border-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          />
        </div>

        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="mt-12 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-4xl">📚</p>
            <p className="mt-4 text-lg font-semibold text-neutral-400">
              {search ? "Tidak ada kursus yang cocok" : "Belum ada kursus"}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <a
                key={course.id}
                href={`/courses/${course.id}`}
                className="group rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                <div className="h-36 bg-gradient-to-br from-[#0A2540] to-[#1a4a7a] flex items-center justify-center relative">
                  <span className="text-5xl">📚</span>
                  {course.status === "published" && (
                    <span className="absolute top-3 right-3 rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">Aktif</span>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#FFC72C]/20 px-2 py-0.5 text-xs font-medium text-[#0A2540]">{course.subject}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[course.level] || "bg-neutral-100 text-neutral-600"}`}>
                      {course.level}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[#0A2540] group-hover:text-[#0A2540]/80 transition-colors line-clamp-2">{course.title}</h3>
                  {course.tutor && <p className="mt-1 text-xs text-neutral-500">Tutor: {course.tutor.name}</p>}
                  <p className="mt-2 text-xs text-neutral-500 line-clamp-2">{course.description || "Tidak ada deskripsi."}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-neutral-400">{course.chapters?.length || 0} bab</span>
                    <span className="text-sm font-semibold text-[#0A2540] group-hover:underline">Lihat Detail →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
