 "use client";

import type { ToastType } from "../types/partner";

type Props = {
  message: string;
  type: ToastType;
  onClose: () => void;
};

export default function Toast({ message, type, onClose }: Props) {
  if (!message) return null;
  const title = type === "success" ? "Berhasil" : type === "error" ? "Terjadi kesalahan" : "Informasi";
  const styles = type === "success"
    ? { border: "border-emerald-500/20", bg: "bg-emerald-500/10", text: "text-emerald-500", progress: "bg-emerald-500" }
    : type === "error"
      ? { border: "border-rose-500/20", bg: "bg-rose-500/10", text: "text-rose-500", progress: "bg-rose-500" }
      : { border: "border-blue-500/20", bg: "bg-blue-500/10", text: "text-blue-500", progress: "bg-blue-500" };
  const icon = type === "success"
    ? <path d="m5 12 4 4L19 6" />
    : type === "error"
      ? <><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>
      : <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
  return <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-3 sm:px-5"
    style={{ paddingTop: "max(12px, env(safe-area-inset-top, 0px))" }}>
    <div key={`${type}-${message}`} role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`kt-toast pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-2xl border ${styles.border} bg-[var(--kt-panel)] p-3.5 shadow-2xl backdrop-blur-2xl sm:p-4`}>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${styles.bg} ${styles.text}`}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`text-xs font-bold ${styles.text}`}>{title}</p>
        <p className="mt-1 break-words text-sm leading-5 text-[var(--kt-muted)]">{message}</p>
      </div>
      <button type="button" onClick={onClose} className="ml-1 rounded-lg p-1 text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]" aria-label="Tutup notifikasi">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m18 6-12 12M6 6l12 12" /></svg>
      </button>
      <span className={`kt-toast-progress absolute bottom-0 left-0 h-[3px] w-full ${styles.progress}`} />
    </div>
  </div>;
}
