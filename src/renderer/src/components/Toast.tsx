import { useEffect } from "react";
import type { ToastMessage } from "../types";

interface Props {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

const COLORS: Record<ToastMessage["type"], string> = {
  error: "#ef4444",
  info: "#3b82f6",
  success: "#4ade80",
};

export function Toast({ toasts, onDismiss }: Props) {
  return (
    <div
      style={{
        bottom: 8,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        left: 8,
        position: "fixed",
        right: 8,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      style={{
        alignItems: "center",
        background: "rgba(15,15,15,0.92)",
        border: `1px solid ${COLORS[toast.type]}`,
        borderRadius: 6,
        color: "#e2e8f0",
        display: "flex",
        fontSize: 12,
        gap: 8,
        justifyContent: "space-between",
        padding: "6px 10px",
      }}
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          background: "none",
          border: "none",
          color: "#64748b",
          cursor: "pointer",
          fontSize: 12,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}
