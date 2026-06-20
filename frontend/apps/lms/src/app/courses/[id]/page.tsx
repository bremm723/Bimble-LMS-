"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Material {
  id: number;
  type: string;
  title: string;
  content: string | null;
  embed_url: string | null;
  sort_order: number;
  status: string;
}

interface Chapter {
  id: number;
  title: string;
  sort_order: number;
  materials?: Material[];
}

interface Course {
  id: number;
  title: string;
  description: string;
  subject: string;
  level: string;
  status: string;
  thumbnail: string | null;
  tutor?: { id: number; name: string };
  branch?: { id: number; name: string };
  chapters?: Chapter[];
}

const typeIcons: Record<string, string> = {
  video: "🎬",
  audio: "🎵",
  text: "📄",
  image: "🖼️",
  link: "🔗",
};

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [error, setError] = useState("");
  const [enrollMessage, setEnrollMessage] = useState("");

  const fetchData = useCallback(async (token: string) => {
    try {
      // Fetch course detail
      const courseRes = await fetch(`${API_URL}/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!courseRes.ok) throw new Error("Kursus tidak ditemukan");
      const courseData: Course = await courseRes.json();
      setCourse(courseData);

      // Check if enrolled
      const myRes = await fetch(`${API_URL}/courses/my`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (myRes.ok) {
        const myData = await myRes.json();
        const isEnrolled = (myData.data || []).some(
          (e: { course_id: number }) => e.course_id === courseData.id
        );
        setEnrolled(isEnrolled);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    const token = localStorage.getItem("auth_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      fetchData(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchData]);

  async function handleEnroll() {
    const token = localStorage.getItem("auth_token");
    if (!token || !course) return;
    setEnrollLoading(true);
    setEnrollMessage("");
    try {
      const res = await fetch(`${API_URL}/courses/${course.id}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setEnrollMessage(data.message || "Gagal mendaftar kursus");
      } else {
        setEnrolled(true);
        setEnrollMessage("Berhasil mendaftar kursus!");
      }
    } catch {
      setEnrollMessage("Gagal terhubung ke server");
    } finally {
      setEnrollLoading(false);
    }
  }

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

  const totalMaterials = course?.chapters?.reduce((acc, ch) => acc + (ch.materials?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
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
            <p className="text-sm font-medium text-neutral-700">{user.name}</p>
            <button onClick={handleLogout} className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <a href="/courses" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-[#0A2540] transition-colors mb-6">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Kembali ke Katalog
        </a>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
        )}

        {!loading && course && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#FFC72C]/20 px-3 py-1 text-sm font-medium text-[#0A2540]">{course.subject}</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">{course.level}</span>
                {course.status === "published" && (
                  <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">Aktif</span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-[#0A2540]">{course.title}</h1>

              {course.tutor && (
                <p className="mt-2 text-sm text-neutral-500">
                  Tutor: <span className="font-medium text-neutral-700">{course.tutor.name}</span>
                </p>
              )}
              {course.branch && (
                <p className="text-sm text-neutral-500">
                  Cabang: <span className="font-medium text-neutral-700">{course.branch.name}</span>
                </p>
              )}

              {course.description && (
                <p className="mt-4 text-neutral-600 leading-relaxed">{course.description}</p>
              )}

              {/* Stats */}
              <div className="mt-6 flex gap-6 border-t border-b border-neutral-200 py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0A2540]">{course.chapters?.length || 0}</p>
                  <p className="text-xs text-neutral-500">Bab</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0A2540]">{totalMaterials}</p>
                  <p className="text-xs text-neutral-500">Materi</p>
                </div>
              </div>

              {/* Chapters */}
              <div className="mt-6">
                <h2 className="text-xl font-bold text-[#0A2540]">Kurikulum</h2>
                {(!course.chapters || course.chapters.length === 0) ? (
                  <p className="mt-4 text-neutral-500">Belum ada materi yang dipublikasikan.</p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {course.chapters.map((chapter, idx) => (
                      <div key={chapter.id} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0A2540] text-xs font-bold text-white">{idx + 1}</span>
                          <h3 className="font-semibold text-[#0A2540]">{chapter.title}</h3>
                          <span className="ml-auto text-xs text-neutral-400">{chapter.materials?.length || 0} materi</span>
                        </div>
                        {chapter.materials && chapter.materials.length > 0 && (
                          <ul className="divide-y divide-neutral-100">
                            {chapter.materials.map((mat) => (
                              <li key={mat.id} className="flex items-center gap-3 px-4 py-2.5">
                                <span className="text-lg">{typeIcons[mat.type] || "📄"}</span>
                                <span className="text-sm text-neutral-700">{mat.title}</span>
                                {mat.status === "published" ? (
                                  enrolled ? (
                                    <span className="ml-auto rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Tersedia</span>
                                  ) : (
                                    <span className="ml-auto rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">🔒 Daftar dulu</span>
                                  )
                                ) : (
                                  <span className="ml-auto rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-600">Draft</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Enroll Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 rounded-2xl border border-neutral-200 bg-white shadow-lg p-6">
                <div className="h-32 rounded-xl bg-gradient-to-br from-[#0A2540] to-[#1a4a7a] flex items-center justify-center mb-4">
                  <span className="text-6xl">📚</span>
                </div>

                {enrolled ? (
                  <div className="text-center">
                    <div className="mb-3 flex items-center justify-center gap-2 rounded-lg bg-green-50 p-3">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-green-700">Sudah Terdaftar</span>
                    </div>
                    <a href="/my-courses" className="block w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#0A2540]/90 transition-colors">
                      Mulai Belajar →
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-neutral-600 mb-4 text-center">Daftarkan diri Anda untuk mengakses semua materi kursus ini.</p>
                    {enrollMessage && (
                      <div className={`mb-3 rounded-lg p-2.5 text-sm text-center ${enrollMessage.includes("Berhasil") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        {enrollMessage}
                      </div>
                    )}
                    <button
                      onClick={handleEnroll}
                      disabled={enrollLoading}
                      className="w-full rounded-lg bg-[#FFC72C] px-4 py-2.5 text-sm font-bold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors disabled:opacity-50"
                    >
                      {enrollLoading ? "Mendaftar..." : "Daftar Kursus Gratis"}
                    </button>
                  </div>
                )}

                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4">
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>📚</span>
                    <span>{course.chapters?.length || 0} bab · {totalMaterials} materi</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>🏫</span>
                    <span>{course.branch?.name || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-600">
                    <span>👨‍🏫</span>
                    <span>{course.tutor?.name || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
