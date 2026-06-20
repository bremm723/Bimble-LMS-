import React from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose?: () => void;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-50 border-green-400 text-green-800",
  error: "bg-red-50 border-red-400 text-red-800",
  info: "bg-blue-50 border-blue-400 text-blue-800",
  warning: "bg-yellow-50 border-yellow-400 text-yellow-800",
};

export function Toast({ message, type = "info", onClose }: ToastProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-4 py-3 shadow-sm ${typeStyles[type]}`}
      role="alert"
    >
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-3 text-current opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
