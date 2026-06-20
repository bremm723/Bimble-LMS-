"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space";

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  status: string;
  thumbnail: string | null;
  tutor?: { name: string };
  chapters?: { id: number; title: string; materials?: unknown[] }[];
}

interface Enrollment {
  id: number;
  course_id: number;
  progress_pct: number;
  enrolled_at: string;
  course?: Course;
}

interface PaginatedResponse {
  data: Enrollment[];
  meta?: { current_page: number; last_page: number; total: number };
}

export default function MyCoursesPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEnrollments = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/courses/my`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat kursus");
      const data: PaginatedResponse = await res.json();
      setEnrollments(data.data || []);
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
      fetchEnrollments(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchEnrollments]);

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
              <a href="/my-courses" className="text-sm font-semibold text-[#0A2540] border-b-2 border-[#FFC72C] pb-0.5">Kursus Saya</a>
              <a href="/courses" className="text-sm font-medium text-neutral-500 hover:text-[#0A2540] transition-colors">Semua Kursus</a>
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
        <h1 className="text-2xl font-bold text-[#0A2540]">Kursus Saya</h1>
        <p className="mt-2 text-neutral-600">Kursus yang sedang Anda ikuti.</p>

        {loading && (
          <div className="mt-8 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && !error && enrollments.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-4xl">📖</p>
            <p className="mt-4 text-lg font-semibold text-neutral-400">Belum ada kursus yang diikuti</p>
            <p className="mt-2 text-sm text-neutral-400">Jelajahi kursus yang tersedia dan mulai belajar.</p>
            <a href="/courses" className="mt-4 inline-flex items-center rounded-lg bg-[#FFC72C] px-5 py-2.5 text-sm font-semibold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors">
              Lihat Kursus
            </a>
          </div>
        )}

        {!loading && enrollments.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => {
              const course = enrollment.course;
              if (!course) return null;
              const totalMaterials = course.chapters?.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0) || 0;
              return (
                <a
                  key={enrollment.id}
                  href={`/courses/${course.id}`}
                  className="group rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="h-36 bg-gradient-to-br from-[#0A2540] to-[#0A2540]/70 flex items-center justify-center">
                    <span className="text-5xl">📚</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{course.subject}</span>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">{course.level}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-[#0A2540] group-hover:text-[#0A2540]/80 transition-colors line-clamp-2">{course.title}</h3>
                    {course.tutor && <p className="mt-1 text-xs text-neutral-500">Oleh: {course.tutor.name}</p>}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span>{Math.round(enrollment.progress_pct)}% selesai</span>
                        <span>{totalMaterials} materi</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#FFC72C] to-[#FFD95A] transition-all duration-500"
                          style={{ width: `${enrollment.progress_pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
