"use client";

import { useEffect, useState, useCallback } from "react";
import { useMidtransSnap } from "../../hooks/useMidtransSnap";
import type { MidtransResult } from "../../hooks/useMidtransSnap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space";

interface PaymentScheme {
  id: number;
  name: string;
  type: string;
  amount: string;
}

interface Payment {
  id: number;
  amount: string;
  method: string;
  verification_status: string;
  verified_at: string | null;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: string;
  due_date: string;
  status: "unpaid" | "paid" | "overdue";
  paid_at: string | null;
  scheme?: PaymentScheme;
  payments?: Payment[];
}

const statusConfig = {
  unpaid: { label: "Belum Bayar", class: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  paid: { label: "Lunas", class: "bg-green-50 text-green-700 border-green-200" },
  overdue: { label: "Jatuh Tempo", class: "bg-red-50 text-red-700 border-red-200" },
};

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(amount));
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export default function InvoicesPage() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payMessage, setPayMessage] = useState<{ id: number; type: "success" | "pending" | "error"; text: string } | null>(null);

  const { payInvoice } = useMidtransSnap();

  const fetchInvoices = useCallback(async (token: string) => {
    try {
      const res = await fetch(`${API_URL}/invoices/my`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat tagihan");
      const data = await res.json();
      setInvoices(data.data || []);
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
      fetchInvoices(token);
    } else {
      window.location.href = "/login";
    }
  }, [fetchInvoices]);

  async function handlePay(invoice: Invoice) {
    setPayingId(invoice.id);
    setPayMessage(null);
    try {
      await payInvoice(
        invoice.id,
        (result: MidtransResult) => {
          setPayMessage({ id: invoice.id, type: "success", text: `✅ Pembayaran berhasil! Order ID: ${result.order_id}` });
          // Update invoice status locally
          setInvoices((prev) => prev.map((inv) => inv.id === invoice.id ? { ...inv, status: "paid" } : inv));
        },
        (result: MidtransResult) => {
          setPayMessage({ id: invoice.id, type: "pending", text: `⏳ Pembayaran pending. Silakan selesaikan pembayaran Anda. Order ID: ${result.order_id}` });
        },
        (result: MidtransResult) => {
          setPayMessage({ id: invoice.id, type: "error", text: `❌ Pembayaran gagal. Silakan coba lagi. Status: ${result.transaction_status}` });
        },
        () => {
          // Popup ditutup
        }
      );
    } catch (err: unknown) {
      setPayMessage({ id: invoice.id, type: "error", text: err instanceof Error ? err.message : "Gagal memproses pembayaran" });
    } finally {
      setPayingId(null);
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

  const unpaidTotal = invoices
    .filter((i) => i.status !== "paid")
    .reduce((acc, i) => acc + Number(i.amount), 0);

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
              <a href="/invoices" className="text-sm font-semibold text-[#0A2540] border-b-2 border-[#FFC72C] pb-0.5">Tagihan</a>
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
        <h1 className="text-2xl font-bold text-[#0A2540]">Tagihan Saya</h1>
        <p className="mt-1 text-neutral-600">Kelola dan bayar tagihan kursus Anda.</p>

        {/* Summary card */}
        {!loading && invoices.length > 0 && unpaidTotal > 0 && (
          <div className="mt-6 rounded-xl bg-gradient-to-r from-[#0A2540] to-[#1a4a7a] p-5 text-white shadow-lg">
            <p className="text-sm text-white/70">Total tagihan belum dibayar</p>
            <p className="mt-1 text-3xl font-bold">{formatRupiah(unpaidTotal)}</p>
            <p className="mt-1 text-xs text-white/60">{invoices.filter((i) => i.status !== "paid").length} invoice menunggu pembayaran</p>
          </div>
        )}

        {loading && (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div>
          </div>
        )}

        {error && <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

        {!loading && !error && invoices.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-4 text-lg font-semibold text-neutral-400">Tidak ada tagihan</p>
            <p className="mt-2 text-sm text-neutral-400">Semua tagihan Anda sudah lunas atau belum ada tagihan.</p>
          </div>
        )}

        {!loading && invoices.length > 0 && (
          <div className="mt-6 space-y-4">
            {invoices.map((invoice) => {
              const cfg = statusConfig[invoice.status] || statusConfig.unpaid;
              const isUnpaid = invoice.status !== "paid";
              const isPaying = payingId === invoice.id;
              const msg = payMessage?.id === invoice.id ? payMessage : null;

              return (
                <div key={invoice.id} className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-mono text-sm font-semibold text-[#0A2540]">{invoice.invoice_number}</p>
                          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.class}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {invoice.scheme && (
                          <p className="mt-1 text-sm text-neutral-600">{invoice.scheme.name}</p>
                        )}
                        <div className="mt-2 flex gap-4 text-xs text-neutral-500">
                          <span>Jatuh tempo: <strong>{formatDate(invoice.due_date)}</strong></span>
                          {invoice.paid_at && <span>Dibayar: <strong>{formatDate(invoice.paid_at)}</strong></span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#0A2540]">{formatRupiah(invoice.amount)}</p>
                      </div>
                    </div>

                    {/* Payment message */}
                    {msg && (
                      <div className={`mt-3 rounded-lg p-3 text-sm ${
                        msg.type === "success" ? "bg-green-50 text-green-700" :
                        msg.type === "pending" ? "bg-yellow-50 text-yellow-700" :
                        "bg-red-50 text-red-600"
                      }`}>
                        {msg.text}
                      </div>
                    )}

                    {/* Pay button */}
                    {isUnpaid && (
                      <div className="mt-4 flex items-center gap-3">
                        <button
                          onClick={() => handlePay(invoice)}
                          disabled={isPaying}
                          className="flex items-center gap-2 rounded-lg bg-[#FFC72C] px-5 py-2.5 text-sm font-bold text-[#0A2540] hover:bg-[#FFC72C]/90 transition-colors disabled:opacity-50"
                        >
                          {isPaying ? (
                            <>
                              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Memproses...
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Bayar Sekarang
                            </>
                          )}
                        </button>
                        <span className="text-xs text-neutral-400">via GoPay, QRIS, VA, dll</span>
                      </div>
                    )}

                    {/* Payment history */}
                    {invoice.payments && invoice.payments.length > 0 && (
                      <div className="mt-4 border-t border-neutral-100 pt-3">
                        <p className="text-xs font-semibold text-neutral-500 mb-2">Riwayat Pembayaran</p>
                        {invoice.payments.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs text-neutral-600">
                            <span>{p.method === "gateway" ? "Payment Gateway" : "Transfer Manual"}</span>
                            <span className="font-medium">{formatRupiah(p.amount)}</span>
                            <span className={p.verification_status === "verified" ? "text-green-600" : p.verification_status === "rejected" ? "text-red-500" : "text-yellow-600"}>
                              {p.verification_status === "verified" ? "✓ Terverifikasi" : p.verification_status === "rejected" ? "✗ Ditolak" : "⏳ Pending"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
