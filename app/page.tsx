/* eslint-disable react-hooks/set-state-in-effect */

"use client";



import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormEvent } from "react";
import InstallButton from "./components/InstallButton";

type Theme = "dark" | "light";

type Partner = {
  id: string;
  storeName: string;
  owner: string;
  phone: string;
  address: string;
  totalStock: number;
  lastMovement: string;
  lastMovementAt: string;
};

type StockHistory = {
  id: string;
  partnerId: string;
  storeName: string;
  type: "add" | "sold";
  amount: number;
  note: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
};

type SortBy = "name" | "stock";
type StockAction = "add" | "sold";
type ToastType = "success" | "error" | "info";

const PAGE_SIZE = 6;

const fmt = (n: number) => n.toLocaleString("id-ID");

function dateLabel(value: string) {
  if (!value) return "Belum ada aktivitas";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Belum ada aktivitas"
    : date.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result && typeof result.error === "string"
        ? result.error
        : `Permintaan gagal (${response.status}).`
    );
  }

  return result as T;
}

function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "plus":
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
    case "search":
      return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
    case "store":
      return <svg {...common}><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></svg>;
    case "box":
    case "package":
      return <svg {...common}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5M3 8v9l9 5 9-5V8M12 13v9" /></svg>;
    case "arrow-up":
      return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
    case "arrow-down":
      return <svg {...common}><path d="M12 5v14m-7-7 7 7 7-7" /></svg>;
    case "chevron-left":
      return <svg {...common}><path d="m15 18-6-6 6-6" /></svg>;
    case "chevron-right":
      return <svg {...common}><path d="m9 18 6-6-6-6" /></svg>;
    case "x":
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>;
    case "check":
      return <svg {...common}><path d="m5 12 4 4L19 6" /></svg>;
    case "alert":
      return <svg {...common}><path d="M12 9v4m0 4h.01" /><path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "trash":
      return <svg {...common}><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></svg>;
    case "phone":
      return <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M11 17h2" /></svg>;
    case "map":
      return <svg {...common}><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>;
    case "moon":
      return <svg {...common}><path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="12" r="9" /></svg>;
  }
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  `${buttonBase} border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] hover:bg-[var(--kt-hover)]`;

const fieldClass =
  "kt-field mt-2 w-full rounded-xl border border-[var(--kt-border)] bg-[var(--kt-input)] px-3 text-sm text-[var(--kt-text)] outline-none transition placeholder:text-[var(--kt-muted)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function Home() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [action, setAction] = useState<StockAction>("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = partners.find((p) => p.id === selectedId) ?? null;

  const refreshPartners = useCallback(async () => {
    const result = await apiRequest<{ partners: Partner[] }>("/api/partners");
    setPartners(result.partners);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadPartners() {
      setLoading(true);
      setError("");

      try {
        const result = await apiRequest<{ partners: Partner[] }>("/api/partners");
        if (active) setPartners(result.partners);
      } catch (err) {
        console.error("Gagal membaca data toko:", err);
        if (active) {
          setError(err instanceof Error ? err.message : "Gagal membaca data toko.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPartners();

    return () => {
      active = false;
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!notice) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setNotice("");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notice]);

  const loadHistory = useCallback(async (partnerId: string) => {
    setHistoryLoading(true);
    setHistoryError("");
    setHistory([]);

    try {
      const result = await apiRequest<{ history: StockHistory[] }>(
        `/api/partners/${encodeURIComponent(partnerId)}/history`
      );
      setHistory(result.history);
    } catch (err) {
      console.error("Gagal membaca riwayat stok:", err);
      setHistoryError(
        err instanceof Error ? err.message : "Gagal membaca riwayat transaksi."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id-ID");

    return [...partners]
      .filter((partner) =>
        partner.storeName.toLocaleLowerCase("id-ID").includes(query)
      )
      .sort((a, b) => {
        const result =
          sortBy === "name"
            ? a.storeName.localeCompare(b.storeName, "id")
            : a.totalStock - b.totalStock;

        return sortAsc ? result : -result;
      });
  }, [partners, search, sortBy, sortAsc]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const totalStock = partners.reduce(
    (sum, partner) => sum + partner.totalStock,
    0
  );

  function flash(message: string, type: ToastType = "success") {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);

    setToastType(type);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 3600);
  }

  async function addPartner(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;

    setError("");

    const form = new FormData(e.currentTarget);
    const storeName = cleanText(form.get("storeName"));
    const owner = cleanText(form.get("owner"));
    const phone = cleanText(form.get("phone"));
    const address = cleanText(form.get("address"));

    if (!storeName || !owner || !phone || !address) {
      setError("Lengkapi semua informasi toko.");
      return;
    }

    if (
      storeName.length > 100 ||
      owner.length > 100 ||
      phone.length > 30 ||
      address.length > 300
    ) {
      setError("Nama, pemilik, telepon, atau alamat terlalu panjang.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest<{ id: string }>("/api/partners", {
        method: "POST",
        body: JSON.stringify({ storeName, owner, phone, address }),
      });

      await refreshPartners();
      setShowAdd(false);
      setPage(1);
      setSearch("");
      flash("Toko berhasil ditambahkan.");
    } catch (err) {
      console.error("Gagal menambahkan toko:", err);
      setError(err instanceof Error ? err.message : "Gagal menyimpan toko.");
    } finally {
      setSaving(false);
    }
  }

  async function saveStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || saving) return;

    const quantity = Number(amount);
    const cleanNote = note.trim();

    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setError("Jumlah harus bilangan bulat positif.");
      return;
    }

    if (cleanNote.length > 500) {
      setError("Catatan maksimal 500 karakter.");
      return;
    }

    const partnerId = selected.id;
    setSaving(true);
    setError("");

    try {
      const result = await apiRequest<{ stockAfter: number }>(
        `/api/partners/${encodeURIComponent(partnerId)}/stock`,
        {
          method: "POST",
          body: JSON.stringify({
            type: action,
            amount: quantity,
            note: cleanNote,
          }),
        }
      );

      await Promise.all([refreshPartners(), loadHistory(partnerId)]);
      setAmount("");
      setNote("");

      flash(`Stok tersimpan. Stok sekarang ${fmt(result.stockAfter)} unit.`);
    } catch (err) {
      console.error("Gagal menyimpan transaksi stok:", err);
      setError(err instanceof Error ? err.message : "Transaksi gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function removePartner() {
    if (!selected || saving) return;

    setSaving(true);
    setError("");

    const storeName = selected.storeName;
    const partnerId = selected.id;

    try {
      await apiRequest<{ success: boolean }>(
        `/api/partners/${encodeURIComponent(partnerId)}`,
        { method: "DELETE" }
      );

      await refreshPartners();
      setConfirmDelete(false);
      setSelectedId(null);
      setHistory([]);
      setHistoryError("");
      flash(`${storeName} berhasil dihapus.`);
    } catch (err) {
      console.error("Gagal menghapus toko:", err);
      setError(err instanceof Error ? err.message : "Gagal menghapus toko.");
    } finally {
      setSaving(false);
    }
  }

  function openPartner(partnerId: string) {
    setSelectedId(partnerId);
    setAction("add");
    setAmount("");
    setNote("");
    setError("");
    setHistory([]);
    setHistoryError("");
    void loadHistory(partnerId);
  }

  function closeDetail() {
    if (saving) return;
    setSelectedId(null);
    setConfirmDelete(false);
    setError("");
  }

  const [theme, setTheme] = useState<Theme>("dark");
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kt-theme");
      const initialTheme: Theme = saved === "light" ? "light" : "dark";

      document.documentElement.dataset.theme = initialTheme;
      document.documentElement.style.colorScheme = initialTheme;

      setTheme(initialTheme);
    } catch {
      setTheme("dark");
    } finally {
      setThemeReady(true);
    }
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;

    try {
      localStorage.setItem("kt-theme", nextTheme);
    } catch {
      // Tema tetap berubah untuk sesi ini meskipun penyimpanan gagal.
    }
  }

  const inputFields = [
    ["storeName", "Nama toko", 100],
    ["owner", "Nama pemilik", 100],
    ["phone", "Nomor telepon", 30],
    ["address", "Alamat toko", 300],
  ] as const;

  return (
    <main className="kt-app min-h-screen overflow-x-hidden bg-[var(--kt-bg)] text-[var(--kt-text)] transition-colors duration-300">
      <style jsx global>{`
        :root,
        html[data-theme="dark"] {
          color-scheme: dark;
          --kt-bg: #070b14;
          --kt-panel: #101827;
          --kt-panel-secondary: #0c1321;
          --kt-input: #080f1c;
          --kt-text: #f1f5f9;
          --kt-muted: #94a3b8;
          --kt-subtle: rgba(148, 163, 184, 0.055);
          --kt-hover: rgba(148, 163, 184, 0.1);
          --kt-border: rgba(148, 163, 184, 0.15);
          --kt-divider: rgba(148, 163, 184, 0.1);
          --kt-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
          --kt-header: rgba(7, 11, 20, 0.82);
        }

        html[data-theme="light"] {
          color-scheme: light;
          --kt-bg: #f4f7fb;
          --kt-panel: #ffffff;
          --kt-panel-secondary: #f8fafc;
          --kt-input: #ffffff;
          --kt-text: #172033;
          --kt-muted: #64748b;
          --kt-subtle: rgba(15, 23, 42, 0.035);
          --kt-hover: rgba(37, 99, 235, 0.07);
          --kt-border: rgba(100, 116, 139, 0.2);
          --kt-divider: rgba(100, 116, 139, 0.16);
          --kt-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          --kt-header: rgba(255, 255, 255, 0.84);
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background: var(--kt-bg);
        }

        .kt-app {
          background-image:
            radial-gradient(
              ellipse at 10% 0%,
              rgba(37, 99, 235, 0.09),
              transparent 34%
            ),
            radial-gradient(
              ellipse at 100% 18%,
              rgba(6, 182, 212, 0.055),
              transparent 28%
            );
        }

        .kt-header {
          position: sticky;
          top: 0;
          z-index: 40;
          display: flex;
          min-height: 76px;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid var(--kt-divider);
          background: var(--kt-header);
          padding: 14px max(20px, calc((100vw - 1280px) / 2));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .kt-brand {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 13px;
        }

        .kt-brand-icon {
          display: grid;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(96, 165, 250, 0.32);
          border-radius: 15px;
          background: linear-gradient(
            135deg,
            rgba(37, 99, 235, 0.2),
            rgba(6, 182, 212, 0.13)
          );
          color: #60a5fa;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }

        .kt-brand-icon span {
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.06em;
        }

        .kt-brand-copy {
          min-width: 0;
        }

        .kt-brand-copy h1 {
          color: var(--kt-text);
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.025em;
          line-height: 1.4;
        }

        .kt-brand-copy p {
          margin-top: 3px;
          color: var(--kt-muted);
          font-size: 11px;
          line-height: 1.4;
        }

        .kt-theme-toggle {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 9px;
          border: 1px solid var(--kt-border);
          border-radius: 999px;
          background: var(--kt-subtle);
          padding: 7px 10px;
          color: var(--kt-text);
          font-size: 12px;
          font-weight: 650;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            transform 180ms ease;
        }

        .kt-theme-toggle:hover {
          transform: translateY(-1px);
          border-color: rgba(96, 165, 250, 0.42);
          background: var(--kt-hover);
        }

        .kt-theme-toggle:focus-visible {
          outline: 2px solid #60a5fa;
          outline-offset: 3px;
        }

        .kt-theme-toggle:disabled {
          cursor: wait;
          opacity: 0.65;
        }

        .kt-theme-icon {
          display: grid;
          width: 27px;
          height: 27px;
          place-items: center;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.12);
          color: #60a5fa;
        }

        .kt-theme-track {
          display: flex;
          width: 30px;
          height: 17px;
          align-items: center;
          border: 1px solid var(--kt-border);
          border-radius: 999px;
          background: var(--kt-subtle);
          padding: 2px;
        }

        .kt-theme-thumb {
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #64748b;
          transition:
            transform 180ms ease,
            background 180ms ease;
        }

        .kt-theme-thumb.is-light {
          transform: translateX(12px);
          background: #3b82f6;
        }

        .kt-panel {
          border: 1px solid var(--kt-border);
          background: var(--kt-panel);
          box-shadow: var(--kt-shadow);
        }

        .kt-field {
          transition:
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease;
        }

        .kt-field:focus {
          outline: none;
          border-color: rgba(59, 130, 246, 0.8);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
        }

        .kt-modal-backdrop {
          animation: kt-fade-in 180ms ease-out both;
        }

        .kt-modal-content {
          animation: kt-fade-up 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .kt-toast {
          animation: kt-toast-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .kt-toast-progress {
          transform-origin: left;
          animation: kt-progress 3.6s linear both;
        }

        .kt-skeleton {
          background: linear-gradient(
            90deg,
            rgba(148, 163, 184, 0.06),
            rgba(148, 163, 184, 0.15),
            rgba(148, 163, 184, 0.06)
          );
          background-size: 200% 100%;
          animation: kt-shimmer 1.5s infinite;
        }

        .kt-hero {
          border-color: var(--kt-border);
          background:
            radial-gradient(
              ellipse at 100% 0%,
              rgba(37, 99, 235, 0.12),
              transparent 45%
            ),
            var(--kt-panel);
        }

        .kt-stock-summary {
          border-color: var(--kt-border);
          background: var(--kt-panel-secondary);
        }

        .kt-info-row {
          border-color: var(--kt-divider);
        }

        .kt-table-row {
          border-color: var(--kt-divider);
        }

        html[data-theme="light"] .kt-skeleton {
          background: linear-gradient(
            90deg,
            rgba(100, 116, 139, 0.07),
            rgba(100, 116, 139, 0.15),
            rgba(100, 116, 139, 0.07)
          );
          background-size: 200% 100%;
        }

        @keyframes kt-fade-up {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.99);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes kt-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes kt-toast-in {
          from {
            opacity: 0;
            transform: translate(-50%, 18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes kt-progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }

        @keyframes kt-shimmer {
          to { background-position: -200% 0; }
        }

        @media (max-width: 640px) {
          .kt-header {
            min-height: 68px;
            padding: 12px 16px;
          }

          .kt-brand {
            gap: 10px;
          }

          .kt-brand-icon {
            width: 39px;
            height: 39px;
            border-radius: 13px;
          }

          .kt-brand-copy h1 {
            font-size: 13px;
          }

          .kt-brand-copy p {
            font-size: 10px;
          }

          .kt-theme-toggle {
            gap: 6px;
            padding: 6px 8px;
          }

          .kt-theme-label {
            font-size: 11px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="kt-header">
        <div className="kt-brand">
          <div className="kt-brand-icon">
            <span>HSM</span>
          </div>

          <div className="kt-brand-copy">
            <h1>Kerupuk Tahu</h1>
            <p>Partner Management Dashboard</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          disabled={!themeReady}
          className="kt-theme-toggle"
          aria-label={
            theme === "dark"
              ? "Aktifkan mode terang"
              : "Aktifkan mode gelap"
          }
          aria-pressed={theme === "light"}
          title={theme === "dark" ? "Mode terang" : "Mode gelap"}
        >
          <span className="kt-theme-icon" aria-hidden="true">
            <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
          </span>
          <span className="kt-theme-label">
            {theme === "dark" ? "Light" : "Dark"}
          </span>
          <span className="kt-theme-track" aria-hidden="true">
            <span
              className={`kt-theme-thumb ${
                theme === "light" ? "is-light" : ""
              }`}
            />
          </span>
        </button>
            <InstallButton />
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero */}
        <section className="kt-hero relative overflow-hidden rounded-3xl border p-5 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.07) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "linear-gradient(to bottom right, black, transparent 80%)",
            }}
          />
          <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-blue-500/15 blur-[90px]" />
          <div className="pointer-events-none absolute -bottom-28 left-[25%] h-56 w-56 rounded-full bg-cyan-500/10 blur-[85px]" />

          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-blue-500">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Workspace / Overview
              </div>

              <h2 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-[var(--kt-text)] sm:mt-6 sm:text-5xl">
                Kelola mitra.
                <br />
                <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                  Kendalikan stok.
                </span>
              </h2>

              <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--kt-muted)] sm:text-base">
                Satu ruang untuk mengelola toko, memantau persediaan, dan
                menelusuri setiap transaksi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition duration-200 hover:border-blue-500/30 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--kt-muted)]">Total Toko</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
                    <Icon name="store" size={17} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--kt-text)]">
                  {fmt(partners.length)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--kt-muted)]">
                  Mitra terdaftar
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition duration-200 hover:border-cyan-500/30 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--kt-muted)]">Total Stok</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500">
                    <Icon name="package" size={17} />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--kt-text)]">
                  {fmt(totalStock)}
                </p>
                <p className="mt-1 text-[11px] text-[var(--kt-muted)]">
                  Unit produk
                </p>
              </div>
            </div>
          </div>
        </section>

        {error && !showAdd && !selected && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-500"
          >
            <Icon name="alert" className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              className="rounded-lg p-1 opacity-70 transition hover:bg-rose-500/10 hover:opacity-100"
              aria-label="Tutup pesan"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        {/* Daftar toko */}
        <section className="kt-panel overflow-hidden rounded-3xl">
          <div className="flex flex-col gap-4 border-b border-[var(--kt-divider)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:p-7">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
                <h3 className="text-lg font-bold tracking-tight text-[var(--kt-text)]">
                  Daftar Toko
                </h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--kt-muted)]">
                Pilih toko untuk melihat detail, mengelola stok, dan membuka
                riwayat.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowAdd(true);
              }}
              className={`${buttonBase} bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/15 hover:-translate-y-0.5 hover:from-blue-500 hover:to-indigo-500`}
            >
              <Icon name="plus" size={18} />
              Tambah Toko
            </button>
          </div>

          {/* Pencarian dan sorting */}
          <div className="flex flex-col gap-4 border-b border-[var(--kt-divider)] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full lg:max-w-md">
              <label
                htmlFor="store-search"
                className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]"
              >
                Pencarian
              </label>

              <div className="relative">
                <Icon
                  name="search"
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kt-muted)]"
                />
                <input
                  id="store-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama toko..."
                  className={`${fieldClass} h-12 pl-11 pr-10`}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--kt-muted)] transition hover:text-blue-500"
                    aria-label="Hapus pencarian"
                  >
                    <Icon name="x" size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1 sm:min-w-[190px]">
                <label
                  htmlFor="sort-by"
                  className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]"
                >
                  Urutkan berdasarkan
                </label>
                <select
                  id="sort-by"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortBy);
                    setPage(1);
                  }}
                  className={`${fieldClass} h-12 cursor-pointer`}
                >
                  <option value="name">Nama toko</option>
                  <option value="stock">Jumlah stok</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSortAsc((value) => !value);
                  setPage(1);
                }}
                aria-label={
                  sortAsc
                    ? "Urutan naik, klik untuk urutan turun"
                    : "Urutan turun, klik untuk urutan naik"
                }
                title={sortAsc ? "Urutan naik" : "Urutan turun"}
                className={`${secondaryButton} h-12 shrink-0`}
              >
                <Icon name={sortAsc ? "arrow-up" : "arrow-down"} size={17} />
                {sortAsc ? "Naik" : "Turun"}
              </button>
            </div>
          </div>

          {/* Tabel */}
          <div className="p-4 sm:p-6">
            <div className="overflow-hidden rounded-2xl border border-[var(--kt-border)]">
              <div className="w-full min-w-0">
                <table className="w-full table-fixed text-left">
                  <thead>
                    <tr className="border-b border-[var(--kt-divider)] bg-[var(--kt-subtle)] text-[10px] uppercase tracking-wider text-[var(--kt-muted)] sm:text-xs">
                      <th className="w-10 px-2 py-3 font-bold sm:w-16 sm:px-5 sm:py-4">
                        No.
                      </th>
                      <th className="px-2 py-3 font-bold sm:px-5 sm:py-4">
                        Informasi Toko
                      </th>
                      <th className="w-[108px] px-2 py-3 text-right font-bold sm:w-36 sm:px-5 sm:py-4">
                        Total Stok
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[var(--kt-divider)]">
                    {loading &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <tr key={i}>
                          <td className="px-2 py-5 sm:px-5">
                            <div className="kt-skeleton h-4 w-5 rounded" />
                          </td>
                          <td className="px-2 py-5 sm:px-5">
                            <div className="space-y-2">
                              <div className="kt-skeleton h-3.5 w-24 max-w-full rounded sm:w-36" />
                              <div className="kt-skeleton h-3 w-20 max-w-full rounded sm:w-24" />
                            </div>
                          </td>
                          <td className="px-2 py-5 sm:px-5">
                            <div className="kt-skeleton ml-auto h-6 w-14 rounded-lg sm:w-20" />
                          </td>
                        </tr>
                      ))}

                    {!loading &&
                      visible.map((partner, index) => (
                        <tr
                          key={partner.id}
                          className="group cursor-pointer transition-colors duration-200 hover:bg-blue-500/[.045]"
                          onClick={() => openPartner(partner.id)}
                        >
                          <td className="px-2 py-4 text-[10px] tabular-nums text-[var(--kt-muted)] sm:px-5 sm:py-5 sm:text-xs">
                            {String(
                              (currentPage - 1) * PAGE_SIZE + index + 1
                            ).padStart(2, "0")}
                          </td>

                          <td className="min-w-0 px-2 py-4 sm:px-5 sm:py-5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openPartner(partner.id);
                              }}
                              className="block w-full min-w-0 text-left"
                            >
                              <span className="block truncate text-xs font-bold text-[var(--kt-text)] transition group-hover:text-blue-500 sm:text-sm">
                                {partner.storeName}
                              </span>
                              <span className="mt-1 block text-[10px] text-[var(--kt-muted)] sm:text-xs">
                                Klik untuk detail
                              </span>
                            </button>
                          </td>

                          <td className="px-2 py-4 text-right sm:px-5 sm:py-5">
                            <span
                              className={`inline-flex max-w-full items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-[10px] font-bold tabular-nums sm:gap-1.5 sm:px-2.5 sm:text-xs ${
                                partner.totalStock > 0
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                  : "border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-muted)]"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  partner.totalStock > 0
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                }`}
                              />
                              <span className="whitespace-nowrap">
                                {fmt(partner.totalStock)} unit
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}

                    {!loading && visible.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-14 text-center sm:px-5 sm:py-16"
                        >
                          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-muted)]">
                            <Icon name="search" size={23} />
                          </span>
                          <p className="mt-4 text-sm font-bold text-[var(--kt-text)]">
                            {search ? "Toko tidak ditemukan" : "Belum ada toko"}
                          </p>
                          <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--kt-muted)]">
                            {search
                              ? "Coba kata kunci lain."
                              : "Tambahkan toko pertama untuk mulai mengelola stok."}
                          </p>
                          {!search && (
                            <button
                              type="button"
                              onClick={() => setShowAdd(true)}
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-500 transition hover:bg-blue-500/15"
                            >
                              <Icon name="plus" size={15} />
                              Tambah toko
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-[var(--kt-muted)]">
                {filtered.length
                  ? (currentPage - 1) * PAGE_SIZE + 1
                  : 0}
                –{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari{" "}
                {filtered.length} toko
              </span>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] transition hover:bg-[var(--kt-hover)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Halaman sebelumnya"
                >
                  <Icon name="chevron-left" size={17} />
                </button>

                <span className="min-w-[100px] text-center text-xs tabular-nums text-[var(--kt-muted)]">
                  Halaman{" "}
                  <strong className="text-[var(--kt-text)]">
                    {currentPage}
                  </strong>{" "}
                  / {pages}
                </span>

                <button
                  type="button"
                  disabled={currentPage === pages}
                  onClick={() => setPage((value) => Math.min(pages, value + 1))}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] transition hover:bg-[var(--kt-hover)] disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Halaman berikutnya"
                >
                  <Icon name="chevron-right" size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t text-center border-[var(--kt-divider)] py-5 text-[11px] text-[var(--kt-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Kerupuk Tahu · Partner Workspace</span>
        </footer>
      </div>

      {/* Modal tambah toko */}
      {showAdd && (
        <div
          className="kt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) setShowAdd(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-title"
            className="kt-modal-content kt-panel my-auto w-full max-w-lg overflow-hidden rounded-3xl"
          >
            <div className="relative overflow-hidden border-b border-[var(--kt-divider)] px-5 py-5 sm:px-7 sm:py-6">
              <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                    <Icon name="store" size={22} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-500">
                      Partner setup
                    </p>
                    <h2
                      id="add-title"
                      className="mt-1 text-xl font-bold text-[var(--kt-text)]"
                    >
                      Tambah Toko
                    </h2>
                    <p className="mt-1 text-sm text-[var(--kt-muted)]">
                      Masukkan informasi toko baru.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAdd(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--kt-border)] text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)] disabled:opacity-40"
                  aria-label="Tutup modal"
                >
                  <Icon name="x" />
                </button>
              </div>
            </div>

            <form onSubmit={addPartner} className="space-y-4 p-5 sm:p-7">
              {inputFields.map(([name, label, maxLength]) => (
                <label
                  key={name}
                  className="block text-xs font-bold text-[var(--kt-text)]"
                >
                  {label}
                  {name === "address" ? (
                    <textarea
                      name={name}
                      required
                      maxLength={maxLength}
                      rows={3}
                      placeholder="Masukkan alamat lengkap"
                      className={`${fieldClass} resize-y p-3 font-normal`}
                    />
                  ) : (
                    <input
                      name={name}
                      required
                      maxLength={maxLength}
                      type={name === "phone" ? "tel" : "text"}
                      placeholder={
                        name === "storeName"
                          ? "Contoh: Toko Berkah"
                          : name === "owner"
                            ? "Nama pemilik toko"
                            : "08xxxxxxxxxx"
                      }
                      className={`${fieldClass} h-12 font-normal`}
                    />
                  )}
                </label>
              ))}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--kt-divider)] pt-5 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAdd(false)}
                  className={`${secondaryButton} flex-1`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`${buttonBase} flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500`}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Icon name="check" size={16} />
                      Simpan Toko
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Modal detail toko */}
      {selected && (
        <div
          className="kt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-title"
            className="kt-modal-content kt-panel my-auto flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl sm:max-h-[90dvh]"
          >
            <header className="flex items-center justify-between gap-4 border-b border-[var(--kt-divider)] px-4 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                  <Icon name="store" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-500">
                    Detail mitra
                  </p>
                  <h2
                    id="detail-title"
                    className="mt-1 truncate text-lg font-bold text-[var(--kt-text)] sm:text-xl"
                  >
                    {selected.storeName}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeDetail}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--kt-border)] text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)] disabled:opacity-40"
                aria-label="Tutup detail"
              >
                <Icon name="x" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
              <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
                {/* Informasi toko */}
                <div className="space-y-5">
                  <div className="kt-stock-summary relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/[.07] to-transparent p-5 sm:p-6">
                    <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-[var(--kt-muted)]">
                          Stok tersedia
                        </p>
                        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                          Live balance
                        </span>
                      </div>
                      <p className="mt-4 break-words text-4xl font-bold tracking-tight text-[var(--kt-text)] sm:text-6xl">
                        {fmt(selected.totalStock)}
                      </p>
                      <p className="mt-1 text-sm text-[var(--kt-muted)]">
                        unit produk
                      </p>
                      <div className="mt-6 border-t border-[var(--kt-divider)] pt-4">
                        <p className="text-sm font-semibold leading-6 text-[var(--kt-text)]">
                          {selected.lastMovement}
                        </p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--kt-muted)]">
                          <Icon name="clock" size={13} />
                          {dateLabel(selected.lastMovementAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[var(--kt-border)]">
                    <div className="border-b border-[var(--kt-divider)] bg-[var(--kt-subtle)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]">
                        Informasi toko
                      </p>
                    </div>

                    {(
                      [
                        ["Nama toko", selected.storeName, "store"],
                        ["Nama pemilik", selected.owner, "store"],
                        ["Nomor telepon", selected.phone, "phone"],
                        ["Alamat", selected.address, "map"],
                      ] as const
                    ).map(([label, value, icon]) => (
                      <div
                        key={label}
                        className="kt-info-row flex items-start gap-3 border-b p-4 last:border-0"
                      >
                        <span className="mt-0.5 text-[var(--kt-muted)]">
                          <Icon name={icon} size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-[var(--kt-muted)]">
                            {label}
                          </p>
                          {label === "Nomor telepon" ? (
                            <a
                              href={`tel:${value}`}
                              className="mt-1 block break-words text-sm font-semibold text-blue-500 transition hover:text-blue-600"
                            >
                              {value}
                            </a>
                          ) : (
                            <p className="mt-1 break-words text-sm font-medium leading-6 text-[var(--kt-text)]">
                              {value}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kelola stok dan riwayat */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-[var(--kt-text)]">
                      Kelola Stok
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--kt-muted)]">
                      Catat penambahan stok atau jumlah produk yang terjual.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAction("add");
                        setAmount("");
                        setError("");
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:text-sm ${
                        action === "add"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm"
                          : "text-[var(--kt-muted)] hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]"
                      }`}
                    >
                      <Icon name="plus" size={16} />
                      Tambah Stok
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAction("sold");
                        setAmount("");
                        setError("");
                      }}
                      className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:text-sm ${
                        action === "sold"
                          ? "border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-sm"
                          : "text-[var(--kt-muted)] hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]"
                      }`}
                    >
                      <Icon name="arrow-down" size={16} />
                      Stok Terjual
                    </button>
                  </div>

                  <form onSubmit={saveStock} className="space-y-4">
                    <div
                      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
                        action === "add"
                          ? "border-emerald-500/20 bg-emerald-500/[.035]"
                          : "border-rose-500/20 bg-rose-500/[.035]"
                      }`}
                    >
                      <label className="block text-xs font-bold text-[var(--kt-text)]">
                        Jumlah unit
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="Masukkan jumlah"
                          className={`${fieldClass} h-12 text-base font-semibold placeholder:text-sm placeholder:font-normal`}
                        />
                      </label>

                      <label className="mt-4 block text-xs font-bold text-[var(--kt-text)]">
                        Catatan{" "}
                        <span className="font-normal text-[var(--kt-muted)]">
                          (opsional)
                        </span>
                        <textarea
                          rows={2}
                          maxLength={500}
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className={`${fieldClass} resize-y p-3 font-normal`}
                          placeholder="Contoh: pengiriman hari ini"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--kt-muted)]">
                          Stok saat ini
                        </span>
                        <strong className="tabular-nums text-[var(--kt-text)]">
                          {fmt(selected.totalStock)} unit
                        </strong>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--kt-divider)] pt-3 text-sm">
                        <span className="text-[var(--kt-muted)]">
                          Perkiraan setelah input
                        </span>
                        <strong
                          className={`text-right tabular-nums ${
                            action === "sold" &&
                            Number(amount) > selected.totalStock
                              ? "text-rose-500"
                              : action === "add"
                                ? "text-emerald-500"
                                : "text-blue-500"
                          }`}
                        >
                          {amount &&
                          Number.isSafeInteger(Number(amount)) &&
                          Number(amount) > 0
                            ? fmt(
                                action === "add"
                                  ? selected.totalStock + Number(amount)
                                  : selected.totalStock - Number(amount)
                              )
                            : fmt(selected.totalStock)}{" "}
                          unit
                        </strong>
                      </div>

                      {action === "sold" &&
                        Number(amount) > selected.totalStock &&
                        Number(amount) > 0 && (
                          <p className="mt-3 text-xs text-rose-500">
                            Jumlah melebihi stok yang tersedia.
                          </p>
                        )}
                    </div>

                    {error && (
                      <p
                        role="alert"
                        className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500"
                      >
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 ${
                        action === "add"
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/10 hover:from-emerald-500 hover:to-teal-500"
                          : "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-900/10 hover:from-rose-500 hover:to-pink-500"
                      }`}
                    >
                      {saving ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Menyimpan transaksi...
                        </>
                      ) : (
                        <>
                          <Icon name="check" size={17} />
                          {action === "add"
                            ? "Simpan Penambahan Stok"
                            : "Simpan Penjualan"}
                        </>
                      )}
                    </button>
                  </form>

                  {/* Riwayat */}
                  <div className="border-t border-[var(--kt-divider)] pt-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--kt-text)]">
                          Riwayat Stok
                        </h3>
                        <p className="mt-1 text-xs text-[var(--kt-muted)]">
                          Catatan aktivitas toko ini.
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={historyLoading}
                        onClick={() => void loadHistory(selected.id)}
                        className={`${secondaryButton} px-3 py-2 text-xs`}
                      >
                        <Icon name="refresh" size={14} />
                        Muat ulang
                      </button>
                    </div>

                    {historyLoading && (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <div
                            key={i}
                            className="kt-skeleton h-28 rounded-xl"
                          />
                        ))}
                      </div>
                    )}

                    {historyError && !historyLoading && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-500">
                        <p>{historyError}</p>
                        <button
                          type="button"
                          onClick={() => void loadHistory(selected.id)}
                          className="mt-2 font-bold underline underline-offset-4"
                        >
                          Coba lagi
                        </button>
                      </div>
                    )}

                    {!historyLoading &&
                      !historyError &&
                      history.length === 0 && (
                        <div className="rounded-xl border border-dashed border-[var(--kt-border)] bg-[var(--kt-subtle)] px-4 py-8 text-center">
                          <Icon
                            name="clock"
                            size={22}
                            className="mx-auto text-[var(--kt-muted)]"
                          />
                          <p className="mt-3 text-sm font-semibold text-[var(--kt-text)]">
                            Belum ada riwayat transaksi
                          </p>
                          <p className="mt-1 text-xs text-[var(--kt-muted)]">
                            Aktivitas stok akan tampil di sini.
                          </p>
                        </div>
                      )}

                    {!historyLoading &&
                      !historyError &&
                      history.length > 0 && (
                        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                          {history.map((item) => (
                            <article
                              key={item.id}
                              className="rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition hover:border-blue-500/25"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-start gap-3">
                                  <span
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                                      item.type === "add"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-rose-500/10 text-rose-500"
                                    }`}
                                  >
                                    <Icon
                                      name={
                                        item.type === "add"
                                          ? "plus"
                                          : "arrow-down"
                                      }
                                      size={17}
                                    />
                                  </span>

                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-[var(--kt-text)]">
                                      {item.type === "add"
                                        ? "Stok ditambahkan"
                                        : "Stok terjual"}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-5 text-[var(--kt-muted)]">
                                      {dateLabel(item.createdAt)}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className={`shrink-0 rounded-lg border px-2 py-1.5 text-[10px] font-bold sm:px-2.5 sm:text-xs ${
                                    item.type === "add"
                                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                      : "border-rose-500/20 bg-rose-500/10 text-rose-500"
                                  }`}
                                >
                                  {item.type === "add" ? "+" : "−"}
                                  {fmt(item.amount)} unit
                                </span>
                              </div>

                              {item.note && (
                                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--kt-muted)]">
                                  {item.note}
                                </p>
                              )}

                              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--kt-divider)] pt-3">
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[var(--kt-muted)]">
                                    Stok sebelum
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-[var(--kt-text)]">
                                    {fmt(item.stockBefore)} unit
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-wider text-[var(--kt-muted)]">
                                    Stok sesudah
                                  </p>
                                  <p className="mt-1 text-sm font-bold text-[var(--kt-text)]">
                                    {fmt(item.stockAfter)} unit
                                  </p>
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Hapus toko */}
                  <div className="border-t border-[var(--kt-divider)] pt-5">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setError("");
                        setConfirmDelete(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm font-bold text-rose-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      <Icon name="trash" size={16} />
                      Hapus Toko
                    </button>
                    <p className="mt-2 text-center text-[11px] text-[var(--kt-muted)]">
                      Pastikan toko yang dipilih sudah benar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Konfirmasi hapus */}
      {confirmDelete && selected && (
        <div className="kt-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="kt-modal-content kt-panel w-full max-w-md overflow-hidden rounded-3xl"
          >
            <div className="p-5 sm:p-7">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
                <Icon name="trash" size={21} />
              </div>

              <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-rose-500">
                Konfirmasi tindakan
              </p>
              <h3
                id="delete-title"
                className="mt-2 text-xl font-bold text-[var(--kt-text)]"
              >
                Hapus toko ini?
              </h3>
              <p className="mt-3 text-sm leading-6 text-[var(--kt-muted)]">
                Yakin ingin menghapus{" "}
                <strong className="text-[var(--kt-text)]">
                  {selected.storeName}
                </strong>
                ? Tindakan ini tidak bisa dibatalkan.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500"
                >
                  {error}
                </p>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmDelete(false)}
                  className={`${secondaryButton} flex-1`}
                >
                  Batal
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={removePartner}
                  className={`${buttonBase} flex-1 bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500`}
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Icon name="trash" size={16} />
                      Ya, Hapus
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Toast notifikasi */}
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex justify-center px-4 sm:bottom-7">
          <div
            role="status"
            aria-live="polite"
            className={`kt-toast pointer-events-auto relative flex w-full max-w-md items-start gap-3 overflow-hidden rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-2xl sm:px-5 ${
              toastType === "success"
                ? "border-emerald-500/20 bg-[var(--kt-panel)]"
                : toastType === "error"
                  ? "border-rose-500/20 bg-[var(--kt-panel)]"
                  : "border-blue-500/20 bg-[var(--kt-panel)]"
            }`}
          >
            <span
              className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
                toastType === "success"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : toastType === "error"
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-blue-500/10 text-blue-500"
              }`}
            >
              <Icon
                name={
                  toastType === "success"
                    ? "check"
                    : toastType === "error"
                      ? "alert"
                      : "clock"
                }
                size={17}
              />
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={`text-xs font-bold ${
                  toastType === "success"
                    ? "text-emerald-500"
                    : toastType === "error"
                      ? "text-rose-500"
                      : "text-blue-500"
                }`}
              >
                {toastType === "success"
                  ? "Berhasil"
                  : toastType === "error"
                    ? "Terjadi kesalahan"
                    : "Informasi"}
              </p>
              <p className="mt-1 break-words text-sm leading-5 text-[var(--kt-muted)]">
                {notice}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (noticeTimer.current) clearTimeout(noticeTimer.current);
                setNotice("");
              }}
              className="ml-1 rounded-lg p-1 text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]"
              aria-label="Tutup notifikasi"
            >
              <Icon name="x" size={16} />
            </button>

            <span
              key={notice}
              className={`kt-toast-progress absolute bottom-0 left-0 h-[2px] w-full ${
                toastType === "success"
                  ? "bg-emerald-500"
                  : toastType === "error"
                    ? "bg-rose-500"
                    : "bg-blue-500"
              }`}
            />
          </div>
        </div>
      )}
    </main>
  );
}
