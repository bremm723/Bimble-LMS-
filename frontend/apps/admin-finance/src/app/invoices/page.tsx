"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface User { id: number; name: string; email: string; }
interface PaymentScheme { id: number; name: string; }
interface Payment { id: number; verification_status: string; }

interface Invoice {
  id: number;
  invoice_number: string;
  amount: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue";
  paid_at: string | null;
  user?: User;
  scheme?: PaymentScheme;
  payments?: Payment[];
}

const statusConfig = {
  unpaid: { label: "Belum Bayar", class: "bg-yellow-50 text-yellow-700" },
  paid: { label: "Lunas", class: "bg-green-50 text-green-700" },
  overdue: { label: "Jatuh Tempo", class: "bg-red-50 text-red-700" },
};

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(amount));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [form, setForm] = useState({ user_id: "", amount: "", due_date: "", scheme_id: "" });

  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) { window.location.href = "/login"; return; }
    try {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`${API_URL}/invoices${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat invoice");
      const data = await res.json();
      setInvoices(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (!stored) { window.location.href = "/login"; return; }
    fetchInvoices();
  }, [fetchInvoices]);

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin_token");
    setFormLoading(true);
    setFormMsg("");
    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, user_id: Number(form.user_id), amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = data.errors ? Object.values(data.errors).flat().join(", ") : data.message;
        setFormMsg(`❌ ${msgs}`);
      } else {
        setFormMsg("✅ Invoice berhasil dibuat!");
        setForm({ user_id: "", amount: "", due_date: "", scheme_id: "" });
        fetchInvoices();
      }
    } catch {
      setFormMsg("❌ Gagal terhubung ke server");
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2540]">Manajemen Invoice</h1>
          <p className="mt-1 text-neutral-600">Kelola tagihan pembayaran siswa.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2540]/90 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Buat Invoice
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#0A2540] mb-4">Buat Invoice Baru</h2>
          {formMsg && (
            <div className={`mb-4 rounded-lg p-3 text-sm ${formMsg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
              {formMsg}
            </div>
          )}
          <form onSubmit={handleCreateInvoice} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ID User Siswa *</label>
              <input type="number" required value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20" placeholder="e.g. 4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Jumlah (Rp) *</label>
              <input type="number" required min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20" placeholder="e.g. 500000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Tanggal Jatuh Tempo *</label>
              <input type="date" required value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">ID Skema Bayar (opsional)</label>
              <input type="number" value={form.scheme_id} onChange={(e) => setForm({ ...form, scheme_id: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-[#0A2540] focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20" placeholder="Kosongkan jika tidak ada" />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={formLoading} className="rounded-lg bg-[#FFC72C] px-5 py-2 text-sm font-bold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors disabled:opacity-50">
                {formLoading ? "Menyimpan..." : "Simpan Invoice"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="mt-6 flex gap-2 flex-wrap">
        {["", "unpaid", "paid", "overdue"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === s ? "bg-[#0A2540] text-white" : "bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50"}`}
          >
            {s === "" ? "Semua" : statusConfig[s as keyof typeof statusConfig]?.label || s}
          </button>
        ))}
      </div>

      {loading && <div className="mt-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div></div>}
      {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">No. Invoice</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Siswa</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Skema</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Jumlah</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Jatuh Tempo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {invoices.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-neutral-400">Tidak ada invoice ditemukan.</td></tr>
              ) : (
                invoices.map((inv) => {
                  const cfg = statusConfig[inv.status] || statusConfig.unpaid;
                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[#0A2540]">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-neutral-800">{inv.user?.name || `User #${inv.id}`}</td>
                      <td className="px-4 py-3 text-neutral-600">{inv.scheme?.name || "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#0A2540]">{formatRupiah(inv.amount)}</td>
                      <td className="px-4 py-3 text-neutral-600">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.class}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
