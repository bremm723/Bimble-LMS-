"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space/api";

interface FinanceDashboard {
  overdue: { count: number; amount: number };
  unpaid: { count: number; amount: number };
  paid_this_month: number;
  recent_overdue: { id: number; invoice_number: string; amount: string; user?: { name: string } }[];
  pending_verifications: {
    id: number;
    amount: string;
    method: string;
    invoice?: { invoice_number: string; user?: { name: string } };
  }[];
}

function formatRupiah(amount: number | string) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(amount));
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [data, setData] = useState<FinanceDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/finance/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat data dashboard");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    const token = localStorage.getItem("admin_token");
    if (stored && token) {
      setUser(JSON.parse(stored));
      fetchDashboard(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchDashboard]);

  if (!user) return null;

  const statCards = [
    {
      label: "Invoice Jatuh Tempo",
      value: data ? `${data.overdue.count} invoice` : "—",
      sub: data ? formatRupiah(data.overdue.amount) : "",
      icon: "⚠️",
      color: "border-red-200 bg-red-50",
      textColor: "text-red-700",
    },
    {
      label: "Belum Dibayar",
      value: data ? `${data.unpaid.count} invoice` : "—",
      sub: data ? formatRupiah(data.unpaid.amount) : "",
      icon: "📄",
      color: "border-yellow-200 bg-yellow-50",
      textColor: "text-yellow-700",
    },
    {
      label: "Penerimaan Bulan Ini",
      value: data ? formatRupiah(data.paid_this_month) : "—",
      sub: "Sudah terkonfirmasi",
      icon: "💰",
      color: "border-green-200 bg-green-50",
      textColor: "text-green-700",
    },
    {
      label: "Menunggu Verifikasi",
      value: data ? `${data.pending_verifications.length} pembayaran` : "—",
      sub: "Perlu ditindaklanjuti",
      icon: "🔍",
      color: "border-blue-200 bg-blue-50",
      textColor: "text-blue-700",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Dashboard Keuangan</h1>
        <p className="mt-1 text-neutral-600">Selamat datang, {user.name}! Berikut ringkasan keuangan hari ini.</p>
      </div>

      {loading && (
        <div className="mt-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
        </div>
      )}

      {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && (
        <>
          {/* Stat cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((stat) => (
              <div key={stat.label} className={`rounded-xl border p-5 ${stat.color}`}>
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs font-medium text-neutral-600">{stat.label}</p>
                <p className={`mt-1 text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
                {stat.sub && <p className="mt-0.5 text-xs text-neutral-500">{stat.sub}</p>}
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Overdue Invoices */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#0A2540]">Invoice Jatuh Tempo</h2>
                <a href="/invoices?status=overdue" className="text-xs text-blue-600 hover:underline">Lihat semua →</a>
              </div>
              {!data?.recent_overdue.length ? (
                <p className="text-sm text-neutral-400 text-center py-6">🎉 Tidak ada invoice jatuh tempo</p>
              ) : (
                <ul className="space-y-3">
                  {data.recent_overdue.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-2 text-sm border-b border-neutral-100 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-neutral-800">{inv.user?.name || "—"}</p>
                        <p className="text-xs text-neutral-500 font-mono">{inv.invoice_number}</p>
                      </div>
                      <span className="font-semibold text-red-600">{formatRupiah(inv.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pending Verifications */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#0A2540]">Menunggu Verifikasi</h2>
                <a href="/payments?status=pending" className="text-xs text-blue-600 hover:underline">Lihat semua →</a>
              </div>
              {!data?.pending_verifications.length ? (
                <p className="text-sm text-neutral-400 text-center py-6">✅ Tidak ada pembayaran pending</p>
              ) : (
                <ul className="space-y-3">
                  {data.pending_verifications.map((pv) => (
                    <li key={pv.id} className="flex items-center justify-between gap-2 text-sm border-b border-neutral-100 pb-2 last:border-0">
                      <div>
                        <p className="font-medium text-neutral-800">{pv.invoice?.user?.name || "—"}</p>
                        <p className="text-xs text-neutral-500">{pv.method === "gateway" ? "Payment Gateway" : "Transfer Manual"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#0A2540]">{formatRupiah(pv.amount)}</p>
                        <a href="/payments" className="text-xs text-blue-600 hover:underline">Verifikasi →</a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { href: "/invoices", label: "Kelola Invoice", icon: "📋", desc: "Buat & kelola tagihan siswa" },
              { href: "/payments", label: "Verifikasi Bayar", icon: "✅", desc: "Cek pembayaran pending" },
              { href: "/reports", label: "Laporan Keuangan", icon: "📊", desc: "Profit/loss, rekap pemasukan" },
            ].map((action) => (
              <a
                key={action.href}
                href={action.href}
                className="group rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#FFC72C] transition-all"
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <p className="font-semibold text-[#0A2540]">{action.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{action.desc}</p>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

