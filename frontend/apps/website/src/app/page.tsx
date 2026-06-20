"use client";

import { useState } from "react";
import { Button } from "@bimbel/ui";

const LMS_URL = process.env.NEXT_PUBLIC_LMS_URL || "https://bimble-lms-admin.vercel.app/login";

export default function HomePage() {
  const [contactForm, setContactForm] = useState({ nama: "", email: "", pesan: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "success" | "error">("idle");

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.nama || !contactForm.email || !contactForm.pesan) return;
    // TODO: Replace with actual API call when backend is ready
    setContactStatus("success");
    setContactForm({ nama: "", email: "", pesan: "" });
    setTimeout(() => setContactStatus("idle"), 4000);
  }

  return (
    <>
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#0A2540]">Bimbel</span>
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="#program" className="text-sm font-medium text-neutral-600 hover:text-[#0A2540] transition-colors">Program</a>
            <a href="#testimoni" className="text-sm font-medium text-neutral-600 hover:text-[#0A2540] transition-colors">Testimoni</a>
            <a href="#kontak" className="text-sm font-medium text-neutral-600 hover:text-[#0A2540] transition-colors">Kontak</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a href={`${LMS_URL}/login`} className="text-sm font-medium text-[#0A2540] hover:text-[#0A2540]/80">Masuk</a>
            <a href={`${LMS_URL}/register`} className="inline-flex items-center rounded-lg bg-[#FFC72C] px-4 py-2 text-sm font-semibold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors">
              Daftar Sekarang
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-[#0A2540] text-white">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0F3A5C]" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Raih Prestasi Terbaikmu{" "}
                <span className="text-[#FFC72C]">Bersama Kami</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-neutral-300">
                Platform bimbingan belajar online terintegrasi dengan LMS, ujian online,
                dan sistem rapor otomatis. Belajar kapan saja, di mana saja.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <a href={`${LMS_URL}/register`}>
                  <Button variant="secondary" size="lg">
                    Daftar Sekarang
                  </Button>
                </a>
                <a href="#program">
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-[#0A2540]">
                    Lihat Program
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#0A2540] sm:text-4xl">
                Kenapa Memilih Kami?
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Kami menyediakan solusi pembelajaran lengkap untuk kesuksesan akademikmu.
              </p>
            </div>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Kelas Online & Offline",
                  desc: "Fleksibilitas belajar sesuai gaya belajarmu. Kelas tatap muka dan LMS online tersedia.",
                  icon: "📚",
                },
                {
                  title: "Ujian & Try Out Online",
                  desc: "Berbagai tipe soal dengan auto-grading dan rapor otomatis untuk evaluasi progresmu.",
                  icon: "✍️",
                },
                {
                  title: "E-Sertifikat",
                  desc: "Sertifikat otomatis terbit saat kamu menyelesaikan program atau lulus ujian.",
                  icon: "🏆",
                },
                {
                  title: "Tutor Berpengalaman",
                  desc: "Belajar dari tutor-tutor terbaik yang siap membimbingmu meraih prestasi.",
                  icon: "👨‍🏫",
                },
                {
                  title: "Multi-Cabang",
                  desc: "Tersebar di berbagai kota. Temukan cabang terdekat untuk kelas offline.",
                  icon: "📍",
                },
                {
                  title: "Pembayaran Mudah",
                  desc: "Bayar online via Midtrans atau transfer manual. Fleksibel sesuai kebutuhanmu.",
                  icon: "💳",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="text-3xl">{item.icon}</div>
                  <h3 className="mt-4 text-lg font-semibold text-[#0A2540]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section id="program" className="bg-neutral-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#0A2540] sm:text-4xl">
                Program Kami
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Pilih program yang sesuai dengan kebutuhan belajarmu.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  level: "SD",
                  subjects: ["Matematika", "IPA", "Bahasa Indonesia", "Bahasa Inggris"],
                  price: "Rp 300.000/bulan",
                },
                {
                  level: "SMP",
                  subjects: ["Matematika", "IPA", "Bahasa Indonesia", "Bahasa Inggris", "IPS"],
                  price: "Rp 400.000/bulan",
                },
                {
                  level: "SMA",
                  subjects: ["Matematika", "Fisika", "Kimia", "Biologi", "Bahasa Inggris"],
                  price: "Rp 500.000/bulan",
                },
              ].map((program) => (
                <div
                  key={program.level}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="rounded-lg bg-[#0A2540] px-4 py-2 text-center">
                    <span className="text-lg font-bold text-[#FFC72C]">
                      Kelas {program.level}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {program.subjects.map((s) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-neutral-700">
                        <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {s}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 border-t border-neutral-100 pt-4">
                    <p className="text-center text-lg font-bold text-[#0A2540]">{program.price}</p>
                    <a href={`${LMS_URL}/register`}>
                      <button className="mt-3 w-full rounded-lg bg-[#FFC72C] px-4 py-2 text-sm font-semibold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors">
                        Daftar Sekarang
                      </button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimoni" className="bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-[#0A2540] sm:text-4xl">
                Apa Kata Mereka?
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                Testimoni dari siswa dan orang tua yang telah bergabung.
              </p>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Andi S.", role: "Siswa SMA", text: "Berkat bimbel ini, nilai saya naik signifikan. Materi dan try out-nya sangat membantu persiapan UTBK." },
                { name: "Ibu Rina", role: "Orang Tua", text: "Anak saya jadi lebih termotivasi belajar. Platform-nya mudah digunakan dan laporannya jelas." },
                { name: "Budi P.", role: "Siswa SMP", text: "Tutor-nya asik dan sabar. Fitur LMS-nya keren, bisa belajar kapan saja." },
              ].map((t) => (
                <div key={t.name} className="rounded-xl border border-neutral-200 bg-neutral-50 p-6">
                  <div className="flex text-[#FFC72C]">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-neutral-700">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[#0A2540]">{t.name}</p>
                    <p className="text-xs text-neutral-500">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="kontak" className="bg-neutral-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-[#0A2540] sm:text-4xl">
                  Hubungi Kami
                </h2>
                <p className="mt-4 text-lg text-neutral-600">
                  Punya pertanyaan? Hubungi kami melalui form atau WhatsApp.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-[#FFC72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-neutral-700">info@bimbel.co.id</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-[#FFC72C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-neutral-700">+62 812-3456-7890</span>
                  </div>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Chat via WhatsApp
                  </a>
                </div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                {contactStatus === "success" && (
                  <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
                    Pesan Anda berhasil terkirim! Kami akan segera menghubungi Anda.
                  </div>
                )}
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#0A2540]">Nama</label>
                    <input
                      type="text"
                      required
                      value={contactForm.nama}
                      onChange={(e) => setContactForm({ ...contactForm, nama: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="Nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0A2540]">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                      placeholder="email@contoh.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0A2540]">Pesan</label>
                    <textarea
                      required
                      value={contactForm.pesan}
                      onChange={(e) => setContactForm({ ...contactForm, pesan: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm min-h-[100px]"
                      placeholder="Tulis pesan Anda..."
                    />
                  </div>
                  <Button variant="primary" size="md" className="w-full">
                    Kirim Pesan
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0A2540] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <h3 className="text-lg font-bold text-[#FFC72C]">Bimbel</h3>
              <p className="mt-2 text-sm text-neutral-300">
                Platform bimbingan belajar online terintegrasi.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Kontak</h4>
              <p className="mt-2 text-sm text-neutral-300">
                info@bimbel.co.id<br />+62 812-3456-7890
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">Ikuti Kami</h4>
              <div className="flex items-center gap-4">
                <a href="#" className="text-neutral-300 hover:text-[#FFC72C] transition-colors">Instagram</a>
                <span className="text-neutral-600">·</span>
                <a href="#" className="text-neutral-300 hover:text-[#FFC72C] transition-colors">Facebook</a>
                <span className="text-neutral-600">·</span>
                <a href="#" className="text-neutral-300 hover:text-[#FFC72C] transition-colors">YouTube</a>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-white/10 pt-8 text-center text-sm text-neutral-400">
            © {new Date().getFullYear()} Bimbel. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
