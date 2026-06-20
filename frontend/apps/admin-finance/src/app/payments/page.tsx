"use client";

import { useEffect, useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space";

interface Payment {
  id: number;
  amount: string;
  method: "gateway" | "manual";
  verification_status: "pending" | "verified" | "rejected";
  verified_at: string | null;
  notes: string | null;
  proof_image: string | null;
  transaction_ref: string | null;
  invoice?: {
    id: number;
    invoice_number: string;
    user?: { name: string; email: string };
  };
  verifier?: { name: string };
}

function formatRupiah(amount: string | number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(amount));
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusConfig = {
  pending: { label: "Menunggu", class: "bg-yellow-50 text-yellow-700" },
  verified: { label: "Terverifikasi", class: "bg-green-50 text-green-700" },
  rejected: { label: "Ditolak", class: "bg-red-50 text-red-700" },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ id: number; text: string; ok: boolean } | null>(null);

  const fetchPayments = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) { window.location.href = "/login"; return; }
    try {
      const params = statusFilter ? `?verification_status=${statusFilter}` : "";
      const res = await fetch(`${API_URL}/payments${params}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Gagal memuat pembayaran");
      const data = await res.json();
      setPayments(data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (!stored) { window.location.href = "/login"; return; }
    fetchPayments();
  }, [fetchPayments]);

  async function handleAction(paymentId: number, action: "verify" | "reject") {
    const token = localStorage.getItem("admin_token");
    setActionLoading(paymentId);
    setActionMsg(null);
    try {
      const res = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg({ id: paymentId, text: data.message || "Gagal memproses", ok: false });
      } else {
        setActionMsg({ id: paymentId, text: action === "verify" ? "✅ Pembayaran berhasil diverifikasi" : "❌ Pembayaran ditolak", ok: action === "verify" });
        fetchPayments();
      }
    } catch {
      setActionMsg({ id: paymentId, text: "Gagal terhubung ke server", ok: false });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540]">Verifikasi Pembayaran</h1>
        <p className="mt-1 text-neutral-600">Verifikasi atau tolak pembayaran manual dari siswa.</p>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {["pending", "verified", "rejected", ""].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setLoading(true); }}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${statusFilter === s ? "bg-[#0A2540] text-white" : "bg-white border border-neutral-300 text-neutral-600 hover:bg-neutral-50"}`}
          >
            {s === "" ? "Semua" : statusConfig[s as keyof typeof statusConfig]?.label || s}
          </button>
        ))}
      </div>

      {loading && <div className="mt-12 flex justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0A2540] border-t-transparent"></div></div>}
      {error && <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="mt-6 space-y-4">
          {payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-3 text-neutral-400 font-medium">Tidak ada pembayaran dengan status ini</p>
            </div>
          ) : (
            payments.map((payment) => {
              const cfg = statusConfig[payment.verification_status] || statusConfig.pending;
              const isPending = payment.verification_status === "pending";
              const isActing = actionLoading === payment.id;
              const msg = actionMsg?.id === payment.id ? actionMsg : null;

              return (
                <div key={payment.id} className="rounded-xl border border-neutral-200 bg-white shadow-sm p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.class}`}>{cfg.label}</span>
                        <span className="text-xs text-neutral-400 font-mono">#{payment.id}</span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600">
                          {payment.method === "gateway" ? "Payment Gateway" : "Transfer Manual"}
                        </span>
                      </div>
                      <p className="mt-2 font-semibold text-[#0A2540]">{payment.invoice?.user?.name || "—"}</p>
                      <p className="text-xs text-neutral-500">{payment.invoice?.user?.email}</p>
                      <p className="mt-1 text-xs text-neutral-500 font-mono">Invoice: {payment.invoice?.invoice_number}</p>
                      {payment.transaction_ref && <p className="text-xs text-neutral-400">Ref: {payment.transaction_ref}</p>}
                      {payment.verified_at && <p className="text-xs text-neutral-400">Diproses: {formatDateTime(payment.verified_at)}</p>}
                      {payment.verifier && <p className="text-xs text-neutral-400">Oleh: {payment.verifier.name}</p>}
                      {payment.notes && <p className="mt-1 text-xs text-neutral-500 italic">{payment.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#0A2540]">{formatRupiah(payment.amount)}</p>
                    </div>
                  </div>

                  {/* Proof image */}
                  {payment.proof_image && (
                    <div className="mt-3">
                      <a href={payment.proof_image} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Lihat Bukti Transfer
                      </a>
                    </div>
                  )}

                  {msg && (
                    <div className={`mt-3 rounded-lg p-2.5 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {msg.text}
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => handleAction(payment.id, "verify")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {isActing ? "..." : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Verifikasi
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(payment.id, "reject")}
                        disabled={isActing}
                        className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Tolak
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
