"use client";

import { useCallback, useEffect, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bremm723-bimble-lms.hf.space/api";

// Extend Window to include snap
declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

export interface MidtransResult {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type?: string;
}

interface UseMidtransSnapReturn {
  payInvoice: (
    invoiceId: number,
    onSuccess?: (result: MidtransResult) => void,
    onPending?: (result: MidtransResult) => void,
    onError?: (result: MidtransResult) => void,
    onClose?: () => void
  ) => Promise<void>;
  isSnapLoaded: boolean;
}

export function useMidtransSnap(): UseMidtransSnapReturn {
  const snapLoadedRef = useRef(false);
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

  const snapJsUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const clientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

  useEffect(() => {
    if (snapLoadedRef.current || !clientKey) return;

    // Remove any existing script to avoid duplicates
    const existing = document.querySelector(`script[src*="snap.js"]`);
    if (existing) {
      snapLoadedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.src = snapJsUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => {
      snapLoadedRef.current = true;
    };
    document.head.appendChild(script);
  }, [snapJsUrl, clientKey]);

  const payInvoice = useCallback(
    async (
      invoiceId: number,
      onSuccess?: (result: MidtransResult) => void,
      onPending?: (result: MidtransResult) => void,
      onError?: (result: MidtransResult) => void,
      onClose?: () => void
    ): Promise<void> => {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("Tidak terautentikasi");

      // 1. Get Snap token from backend
      const res = await fetch(`${API_URL}/midtrans/snap`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Gagal membuat transaksi Midtrans");
      }

      const data = await res.json();
      const snapToken: string = data.token;

      // 2. Dynamically get client_key from backend if not in env
      const resolvedClientKey = clientKey || data.client_key || "";

      // 3. Ensure snap.js is loaded with the right client key
      if (!window.snap) {
        // Load snap.js if not loaded yet
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector(`script[src*="snap.js"]`);
          if (existing && window.snap) { resolve(); return; }

          const script = document.createElement("script");
          script.src = isProduction
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute("data-client-key", resolvedClientKey);
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap.js"));
          document.head.appendChild(script);
        });
      }

      // 4. Open payment popup
      if (!window.snap) {
        throw new Error("Midtrans Snap tidak tersedia. Cek koneksi internet.");
      }

      window.snap.pay(snapToken, {
        onSuccess: (result) => {
          console.log("Midtrans payment success", result);
          onSuccess?.(result);
        },
        onPending: (result) => {
          console.log("Midtrans payment pending", result);
          onPending?.(result);
        },
        onError: (result) => {
          console.error("Midtrans payment error", result);
          onError?.(result);
        },
        onClose: () => {
          console.log("Midtrans popup closed");
          onClose?.();
        },
      });
    },
    [clientKey, isProduction]
  );

  return {
    payInvoice,
    isSnapLoaded: snapLoadedRef.current,
  };
}

