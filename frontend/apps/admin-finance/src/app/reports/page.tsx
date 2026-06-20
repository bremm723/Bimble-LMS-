"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space";

interface ProfitLossData {
  period: { from: string; to: string };
  branch_id: number | null;
  total_income: number;
  total_expense: number;
  net_profit: number;
  income_by_category: Record<string, number>;
  expense_by_category: Record<string, number>;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (!stored) { window.location.href = "/login"; }
  }, []);

  async function fetchReport() {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/finance/profit-loss?from=${from}&to=${to}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat laporan");
      setData(await res.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }

  // Auto-fetch on mount
  useEffect(() => {
    fetchReport();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const netIsPositive = data ? data.net_profit >= 0 : true;

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Laporan Keuangan</h1>
        <p className="mt-1 text-neutral-600">Laporan laba/rugi berdasarkan periode yang dipilih.</p>
      </div>

      {/* Period selector */}
      <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Dari Tanggal</label>
          <input
            type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-neutral-500 mb-1">Sampai Tanggal</label>
          <input
            type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none"
          />
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
          Tampilkan Laporan
        </button>
      </div>

      {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {data && (
        <>
          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="text-xs font-semibold text-green-600">Total Pemasukan</p>
              <p className="mt-2 text-2xl font-bold text-green-700">{formatRupiah(data.total_income)}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="text-xs font-semibold text-red-600">Total Pengeluaran</p>
              <p className="mt-2 text-2xl font-bold text-red-700">{formatRupiah(data.total_expense)}</p>
            </div>
            <div className={`rounded-xl border p-5 ${netIsPositive ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
              <p className={`text-xs font-semibold ${netIsPositive ? "text-blue-600" : "text-orange-600"}`}>
                {netIsPositive ? "Laba Bersih" : "Rugi Bersih"}
              </p>
              <p className={`mt-2 text-2xl font-bold ${netIsPositive ? "text-blue-700" : "text-orange-700"}`}>
                {formatRupiah(Math.abs(data.net_profit))}
              </p>
            </div>
          </div>

          {/* Period info */}
          <p className="mt-4 text-xs text-neutral-500">
            Periode: <strong>{new Date(data.period.from).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
            {" — "}
            <strong>{new Date(data.period.to).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Income by category */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0A2540] mb-4">Pemasukan per Kategori</h2>
              {Object.keys(data.income_by_category).length === 0 ? (
                <p className="text-sm text-neutral-400">Tidak ada data pemasukan.</p>
              ) : (
                <ul className="space-y-3">
                  {Object.entries(data.income_by_category).map(([cat, amount]) => (
                    <li key={cat} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-neutral-700">{cat || "Lainnya"}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.min(100, (amount / data.total_income) * 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-green-700 w-28 text-right">{formatRupiah(amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Expense by category */}
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-[#0A2540] mb-4">Pengeluaran per Kategori</h2>
              {Object.keys(data.expense_by_category).length === 0 ? (
                <p className="text-sm text-neutral-400">Tidak ada data pengeluaran.</p>
              ) : (
                <ul className="space-y-3">
                  {Object.entries(data.expense_by_category).map(([cat, amount]) => (
                    <li key={cat} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-neutral-700">{cat || "Lainnya"}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-neutral-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${Math.min(100, data.total_expense > 0 ? (amount / data.total_expense) * 100 : 0)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-red-700 w-28 text-right">{formatRupiah(amount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
