
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
import { PencilLine, Power } from "lucide-react";

import InstallButton from "./components/InstallButton";
import PartnerTable from "./components/PartnerTable";
import AddPartnerModal from "./components/AddPartnerModal";
import ConfirmDeleteDialog from "./components/ConfirmDeleteDialog";
import Toast from "./components/Toast";
import { signOut } from "firebase/auth";
import { auth } from "./lib/firebase-client";

import {
  type Theme,
  type SortBy,
  type StockAction,
  type ToastType,
  type Partner,
  type StockHistory,
  type PartnerForm,
  EMPTY_FORM,
} from "./types/partner";

import {
  fmt,
  dateLabel,
  cleanText,
  apiRequest,
} from "./lib/partner-utils";
import { Icon } from "./components/Icon";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButton =
  `${buttonBase} border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] hover:bg-[var(--kt-hover)]`;

const fieldClass =
  "kt-field mt-2 w-full rounded-xl border border-[var(--kt-border)] bg-[var(--kt-input)] px-3 text-sm text-[var(--kt-text)] outline-none transition placeholder:text-[var(--kt-muted)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";


// Pindahkan helper Icon, konstanta tombol,
// dan seluruh fungsi Dashboard lama ke sini.
function Dashboard() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [toastType, setToastType] = useState<ToastType>("success");
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<PartnerForm>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [action, setAction] = useState<StockAction>("add");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [history, setHistory] = useState<StockHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const DEFAULT_SHOP_NAME = "Kerupuk Tahu";

const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
const [shopLogo, setShopLogo] = useState("");
const [showBrandSettings, setShowBrandSettings] = useState(false);

const [shopNameDraft, setShopNameDraft] = useState(DEFAULT_SHOP_NAME);
const [shopLogoDraft, setShopLogoDraft] = useState("");
const [brandError, setBrandError] = useState("");

  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selected = partners.find((p) => p.id === selectedId) ?? null;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

const handleLogout = async () => {
  if (isLoggingOut) return;

  try {
    setIsLoggingOut(true);
    await signOut(auth);

    // AuthGate akan mendeteksi perubahan status autentikasi
    // melalui onAuthStateChanged dan menampilkan halaman login.
  } catch (error) {
    console.error("Gagal logout:", error);
    window.alert("Gagal keluar dari akun. Silakan coba lagi.");
  } finally {
    setIsLoggingOut(false);
  }
};

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
      if (event.key === "Escape") {
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        setNotice("");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [notice]);

  const closeDetail = useCallback(() => {
    if (saving) return;
    setSelectedId(null);
    setConfirmDelete(false);
    setShowEdit(false);
    setError("");
  }, [saving]);

  useEffect(() => {
    if (!showEdit && !selected && !confirmDelete) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;

      if (confirmDelete) {
        setConfirmDelete(false);
      } else if (showEdit) {
        setShowEdit(false);
        setError("");
      } else if (selected) {
        closeDetail();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showEdit, selected, confirmDelete, saving, closeDetail]);

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

  // Semua hasil ditampilkan. Batas tinggi kontainer membuat daftar
  // bisa digulir secara vertikal tanpa pagination.
  const visible = filtered;

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

    // Simpan referensi form sebelum proses async.
    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    setError("");

    const storeName = cleanText(form.get("storeName"));
    const owner = cleanText(form.get("owner"));
    const phone = cleanText(form.get("phone"));
    const address = cleanText(form.get("address"));

    if (!storeName) {
      setError("Nama toko wajib diisi.");
      return;
    }

    if (
      storeName.length > 100 ||
      owner.length > 100 ||
      phone.length > 30 ||
      address.length > 300
    ) {
      setError("Periksa kembali panjang informasi yang dimasukkan.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest<{ id: string }>("/api/partners", {
        method: "POST",
        body: JSON.stringify({
          storeName,
          owner,
          phone,
          address,
        }),
      });

      await refreshPartners();

      // Tutup popup dan bersihkan form setelah berhasil.
      formElement.reset();
      setShowAdd(false);
      setSearch("");
      setError("");

      flash("Toko berhasil ditambahkan.");
    } catch (err) {
      console.error("Gagal menambahkan toko:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan toko."
      );
    } finally {
      setSaving(false);
    }
  }

  function openEditPartner() {
    if (!selected || saving) return;

    setEditForm({
      storeName: selected.storeName ?? "",
      owner: selected.owner ?? "",
      phone: selected.phone ?? "",
      address: selected.address ?? "",
    });

    setError("");
    setShowEdit(true);
  }

  async function savePartnerInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || saving) return;

    const storeName = editForm.storeName.trim();
    const owner = editForm.owner.trim();
    const phone = editForm.phone.trim();
    const address = editForm.address.trim();

    if (!storeName) {
      setError("Nama toko wajib diisi.");
      return;
    }

    if (
      storeName.length > 100 ||
      owner.length > 100 ||
      phone.length > 30 ||
      address.length > 300
    ) {
      setError("Periksa kembali panjang informasi yang dimasukkan.");
      return;
    }

    const partnerId = selected.id;
    setSaving(true);
    setError("");

    try {
      await apiRequest<{ success: boolean }>(
        `/api/partners/${encodeURIComponent(partnerId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ storeName, owner, phone, address }),
        }
      );

      await refreshPartners();
      setShowEdit(false);
      setError("");
      flash("Informasi toko berhasil diperbarui.");
    } catch (err) {
      console.error("Gagal mengedit informasi toko:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui informasi toko."
      );
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
      setError("");

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
          {
            method: "DELETE",
            body: JSON.stringify({
              storeName: storeName,
            }),
          }
        );

        await refreshPartners();

        setConfirmDelete(false);
        setSelectedId(null);
        setHistory([]);
        setHistoryError("");
        setError("");

        flash(`${storeName} berhasil dihapus.`);
      } catch (err) {
        console.error("Gagal menghapus toko:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Gagal menghapus toko."
        );
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
      // Tema tetap berubah untuk sesi ini.
    }
  }

  useEffect(() => {
  try {
    const savedName = localStorage.getItem("kt-shop-name");
    const savedLogo = localStorage.getItem("kt-shop-logo");

    if (savedName?.trim()) {
      setShopName(savedName);
      setShopNameDraft(savedName);
    }

    if (savedLogo) {
      setShopLogo(savedLogo);
      setShopLogoDraft(savedLogo);
    }
  } catch (err) {
    console.error("Gagal membaca pengaturan toko:", err);
  }
}, []);

function openBrandSettings() {
  setShopNameDraft(shopName);
  setShopLogoDraft(shopLogo);
  setBrandError("");
  setShowBrandSettings(true);
}

function handleShopLogoChange(
  event: React.ChangeEvent<HTMLInputElement>
) {
  const file = event.target.files?.[0];

  if (!file) return;

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    setBrandError("Gunakan gambar PNG, JPG, atau WEBP.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    setBrandError("Ukuran logo maksimal 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result === "string") {
      setShopLogoDraft(reader.result);
      setBrandError("");
    }
  };

  reader.onerror = () => {
    setBrandError("Gagal membaca file logo.");
  };

  reader.readAsDataURL(file);
}

function saveBrandSettings() {
  const cleanName = shopNameDraft.trim();

  if (!cleanName) {
    setBrandError("Nama toko wajib diisi.");
    return;
  }

  if (cleanName.length > 80) {
    setBrandError("Nama toko maksimal 80 karakter.");
    return;
  }

  try {
    localStorage.setItem("kt-shop-name", cleanName);

    if (shopLogoDraft) {
      localStorage.setItem("kt-shop-logo", shopLogoDraft);
    } else {
      localStorage.removeItem("kt-shop-logo");
    }

    setShopName(cleanName);
    setShopLogo(shopLogoDraft);
    setShowBrandSettings(false);
    setBrandError("");

    flash("Identitas toko berhasil diperbarui.");
  } catch (err) {
    console.error("Gagal menyimpan identitas toko:", err);
    setBrandError(
      "Pengaturan gagal disimpan. Coba gunakan gambar yang lebih kecil."
    );
  }
}


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

        html { scroll-behavior: smooth; }
        body { background: var(--kt-bg); }

        .kt-app {
          background-image:
            radial-gradient(ellipse at 10% 0%, rgba(37, 99, 235, 0.09), transparent 34%),
            radial-gradient(ellipse at 100% 18%, rgba(6, 182, 212, 0.055), transparent 28%);
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

        .kt-brand { display: flex; min-width: 0; align-items: center; gap: 13px; }
        .kt-brand-icon {
          display: grid;
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          place-items: center;
          border: 1px solid rgba(96, 165, 250, 0.32);
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(6, 182, 212, 0.13));
          color: #60a5fa;
        }
        .kt-brand-icon span { font-size: 13px; font-weight: 800; letter-spacing: -0.06em; }
        .kt-brand-copy { min-width: 0; }
        .kt-brand-copy h1 { color: var(--kt-text); font-size: 15px; font-weight: 750; letter-spacing: -0.025em; line-height: 1.4; }
        .kt-brand-copy p { margin-top: 3px; color: var(--kt-muted); font-size: 11px; line-height: 1.4; }

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
          transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
        }
        .kt-theme-toggle:hover { transform: translateY(-1px); border-color: rgba(96, 165, 250, 0.42); background: var(--kt-hover); }
        .kt-theme-toggle:focus-visible { outline: 2px solid #60a5fa; outline-offset: 3px; }
        .kt-theme-toggle:disabled { cursor: wait; opacity: 0.65; }
        .kt-theme-icon { display: grid; width: 27px; height: 27px; place-items: center; border-radius: 50%; background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
        .kt-theme-track { display: flex; width: 30px; height: 17px; align-items: center; border: 1px solid var(--kt-border); border-radius: 999px; background: var(--kt-subtle); padding: 2px; }
        .kt-theme-thumb { width: 11px; height: 11px; border-radius: 50%; background: #64748b; transition: transform 180ms ease, background 180ms ease; }
        .kt-theme-thumb.is-light { transform: translateX(12px); background: #3b82f6; }

        .kt-panel { border: 1px solid var(--kt-border); background: var(--kt-panel); box-shadow: var(--kt-shadow); }
        .kt-field { transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease; }
        .kt-field:focus { outline: none; border-color: rgba(59, 130, 246, 0.8); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
        .kt-modal-backdrop { animation: kt-fade-in 180ms ease-out both; }
        .kt-modal-content { animation: kt-fade-up 240ms cubic-bezier(0.2, 0.8, 0.2, 1) both; }
        .kt-toast { animation: kt-toast-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both; will-change: transform, opacity; }
        .kt-toast-progress { transform-origin: left; animation: kt-progress 3.6s linear both; }
        .kt-skeleton {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.06), rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.06));
          background-size: 200% 100%;
          animation: kt-shimmer 1.5s infinite;
        }
        .kt-hero {
          border-color: var(--kt-border);
          background: radial-gradient(ellipse at 100% 0%, rgba(37, 99, 235, 0.12), transparent 45%), var(--kt-panel);
        }
        .kt-stock-summary { border-color: var(--kt-border); background: var(--kt-panel-secondary); }
        .kt-info-row, .kt-table-row { border-color: var(--kt-divider); }
        .kt-table-scroll { max-height: 480px; overflow-y: auto; overscroll-behavior: contain; }
        .kt-table-scroll thead { position: sticky; top: 0; z-index: 5; }
        .kt-table-scroll thead tr { background: var(--kt-panel); }
        html[data-theme="light"] .kt-skeleton {
          background: linear-gradient(90deg, rgba(100, 116, 139, 0.07), rgba(100, 116, 139, 0.15), rgba(100, 116, 139, 0.07));
          background-size: 200% 100%;
        }

        @keyframes kt-fade-up {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kt-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes kt-toast-in {
          from { opacity: 0; transform: translateY(-14px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes kt-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes kt-shimmer { to { background-position: -200% 0; } }

        @media (max-width: 640px) {
          .kt-header { min-height: 68px; padding: 12px 16px; gap: 8px; }
          .kt-brand { gap: 10px; }
          .kt-brand-icon { width: 39px; height: 39px; border-radius: 13px; }
          .kt-brand-copy h1 { font-size: 13px; }
          .kt-brand-copy p { font-size: 10px; }
          .kt-theme-toggle { gap: 6px; padding: 6px 8px; }
          .kt-theme-label { font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
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
          <button
  type="button"
  onClick={openBrandSettings}
  className="kt-brand group rounded-xl text-left transition hover:opacity-85"
  title="Ubah nama dan logo toko"
>
  <div className="kt-brand-icon overflow-hidden">
    {shopLogo ? (
      <img
        src={shopLogo}
        alt={`Logo ${shopName}`}
        className="h-full w-full object-cover"
      />
    ) : (
      <span>
        {shopName
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((word) => word.charAt(0).toUpperCase())
          .join("")}
      </span>
    )}
  </div>

  <div className="kt-brand-copy">
    <h1 className="flex items-center gap-2">
      <span className="truncate">{shopName}</span>
    </h1>
    <p>Partner Management Dashboard</p>
  </div>
</button>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <button
    type="button"
    onClick={handleLogout}
    disabled={isLoggingOut}
    title="Keluar dari akun"
    aria-label="Logout"
    className="inline-flex shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-xs font-semibold text-rose-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
  >
    <Power size={16} strokeWidth={2}/>
    
  </button>
          <button
            type="button"
            onClick={toggleTheme}
            disabled={!themeReady}
            className="kt-theme-toggle"
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            aria-pressed={theme === "light"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            <span className="kt-theme-icon" aria-hidden="true">
              <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
            </span>
            
          </button>
              
          <InstallButton />
        </div>
      </header>
      {showBrandSettings && (
  <div
    className="kt-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setShowBrandSettings(false);
        setBrandError("");
      }
    }}
  >
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-settings-title"
      className="kt-modal-content kt-panel my-auto w-full max-w-md overflow-hidden rounded-3xl"
    >
      <header className="flex items-center justify-between gap-4 border-b border-[var(--kt-divider)] p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-500">
            Pengaturan workspace
          </p>
          <h2
            id="brand-settings-title"
            className="mt-1 text-lg font-bold text-[var(--kt-text)]"
          >
            Identitas Toko
          </h2>
          <p className="mt-1 text-xs text-[var(--kt-muted)]">
            Atur nama dan logo yang tampil di dashboard.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowBrandSettings(false);
            setBrandError("");
          }}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--kt-border)] text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)]"
          aria-label="Tutup pengaturan"
        >
          <Icon name="x" size={18} />
        </button>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex flex-col items-center rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-6">
          <div className="kt-brand-icon h-24 w-24 overflow-hidden rounded-3xl">
            {shopLogoDraft ? (
              <img
                src={shopLogoDraft}
                alt="Pratinjau logo toko"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl">
                {shopNameDraft
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word.charAt(0).toUpperCase())
                  .join("") || "KT"}
              </span>
            )}
          </div>

          <p className="mt-3 max-w-full break-words text-center text-sm font-bold text-[var(--kt-text)]">
            {shopNameDraft.trim() || "Nama Toko"}
          </p>

          <p className="mt-1 text-xs text-[var(--kt-muted)]">
            Pratinjau identitas toko
          </p>
        </div>

        <label className="block text-xs font-bold text-[var(--kt-text)]">
          Nama toko <span className="text-rose-500">*</span>
          <input
            type="text"
            required
            maxLength={80}
            value={shopNameDraft}
            onChange={(event) => setShopNameDraft(event.target.value)}
            placeholder="Masukkan nama toko"
            className={`${fieldClass} h-12`}
          />
        </label>

        <div>
          <label
            htmlFor="shop-logo-upload"
            className="block text-xs font-bold text-[var(--kt-text)]"
          >
            Logo toko
          </label>

          <label
            htmlFor="shop-logo-upload"
            className="mt-2 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition hover:border-blue-500/50 hover:bg-[var(--kt-hover)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <Icon name="upload" size={20} />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-[var(--kt-text)]">
                Pilih gambar logo
              </span>
              <span className="mt-1 block text-xs text-[var(--kt-muted)]">
                PNG, JPG, WEBP · Maksimal 2 MB
              </span>
            </span>
          </label>

          <input
            id="shop-logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleShopLogoChange}
            className="sr-only"
          />

          {shopLogoDraft && (
            <button
              type="button"
              onClick={() => {
                setShopLogoDraft("");
                setBrandError("");
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-500/10"
            >
              <Icon name="trash" size={14} />
              Hapus logo
            </button>
          )}
        </div>

        {brandError && (
          <p
            role="alert"
            className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500"
          >
            {brandError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-[var(--kt-divider)] pt-5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setShowBrandSettings(false);
              setBrandError("");
            }}
            className={`${secondaryButton} flex-1`}
          >
            Batal
          </button>

          <button
            type="button"
            onClick={saveBrandSettings}
            className={`${buttonBase} flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500`}
          >
            <Icon name="check" size={16} />
            Simpan Identitas
          </button>
        </div>
      </div>
    </section>
  </div>
)}

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero / Overview */}
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
                Satu ruang untuk mengelola toko, memantau persediaan, dan menelusuri setiap transaksi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition duration-200 hover:border-blue-500/30 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--kt-muted)]">Total Toko</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/10 text-blue-500"><Icon name="store" size={17} /></span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--kt-text)]">{fmt(partners.length)}</p>
                <p className="mt-1 text-[11px] text-[var(--kt-muted)]">Mitra terdaftar</p>
              </div>

              <div className="rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition duration-200 hover:border-cyan-500/30 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--kt-muted)]">Total Stok</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-500"><Icon name="package" size={17} /></span>
                </div>
                <p className="mt-4 text-3xl font-bold tracking-tight text-[var(--kt-text)]">{fmt(totalStock)}</p>
                <p className="mt-1 text-[11px] text-[var(--kt-muted)]">Unit produk</p>
              </div>
            </div>
          </div>

<button
  type="button"
  onClick={() => {
    setError("");
    setShowAdd(true);
  }}
  className={`${buttonBase} group relative isolate mt-4 w-full shrink-0 !text-white overflow-hidden rounded-xl border border-white/20 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-[0_4px_20px_rgba(79,70,229,0.25)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-blue-300/60 hover:shadow-[0_8px_32px_rgba(59,130,246,0.4)] active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none`}
>
  <Icon name="plus" size={18} />
  <span >Tambah Toko</span>
</button>

        </section>

        {/* Pesan error global */}
        {error && !showAdd && !showEdit && !selected && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-500">
            <Icon name="alert" className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} className="rounded-lg p-1 opacity-70 transition hover:bg-rose-500/10 hover:opacity-100" aria-label="Tutup pesan">
              <Icon name="x" size={16} />
            </button>
          </div>
        )}

        <PartnerTable
          partners={visible}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc((value) => !value)}
          onOpen={openPartner}
        />

        <footer className="flex flex-col gap-2 border-t border-[var(--kt-divider)] py-5 text-center text-[11px] text-[var(--kt-muted)] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Kerupuk Tahu · Partner Workspace</span>
        </footer>
      </div>

      {/* Modal detail toko */}
      {selected && (
        <div
          className="kt-modal-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-2 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="detail-title" className="kt-modal-content kt-panel my-auto flex max-h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl sm:max-h-[90dvh]">
            <header className="flex items-center justify-between gap-4 border-b border-[var(--kt-divider)] px-4 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500">
                  <Icon name="store" size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-500">Detail mitra</p>
                  <h2 id="detail-title" className="mt-1 truncate text-lg font-bold text-[var(--kt-text)] sm:text-xl">
                    {selected.storeName}
                  </h2>
                </div>
              </div>
              <button type="button" disabled={saving} onClick={closeDetail} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[var(--kt-border)] text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)] disabled:opacity-40" aria-label="Tutup detail">
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
                        <p className="text-xs font-medium text-[var(--kt-muted)]">Stok tersedia</p>
                        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">Live balance</span>
                      </div>
                      <p className="mt-4 break-words text-4xl font-bold tracking-tight text-[var(--kt-text)] sm:text-6xl">{fmt(selected.totalStock)}</p>
                      <p className="mt-1 text-sm text-[var(--kt-muted)]">unit produk</p>
                      <div className="mt-6 border-t border-[var(--kt-divider)] pt-4">
                        <p className="text-sm font-semibold leading-6 text-[var(--kt-text)]">{selected.lastMovement}</p>
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--kt-muted)]">
                          <Icon name="clock" size={13} />{dateLabel(selected.lastMovementAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                {/* Kelola stok dan riwayat */}
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-[var(--kt-text)]">Kelola Stok</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--kt-muted)]">Catat penambahan stok atau jumlah produk yang terjual.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-1.5">
                    <button type="button" onClick={() => { setAction("add"); setAmount(""); setError(""); }} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:text-sm ${action === "add" ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 shadow-sm" : "text-[var(--kt-muted)] hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]"}`}>
                      <Icon name="plus" size={16} />Tambah Stok
                    </button>
                    <button type="button" onClick={() => { setAction("sold"); setAmount(""); setError(""); }} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold transition sm:text-sm ${action === "sold" ? "border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-sm" : "text-[var(--kt-muted)] hover:bg-[var(--kt-hover)] hover:text-[var(--kt-text)]"}`}>
                      <Icon name="arrow-down" size={16} />Stok Terjual
                    </button>
                  </div>

                  <form onSubmit={saveStock} className="space-y-4">
                    <div className={`rounded-2xl border p-4 transition-colors sm:p-5 ${action === "add" ? "border-emerald-500/20 bg-emerald-500/[.035]" : "border-rose-500/20 bg-rose-500/[.035]"}`}>
                      <label className="block text-xs font-bold text-[var(--kt-text)]">
                        Jumlah unit
                        <input type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Masukkan jumlah" className={`${fieldClass} h-12 text-base font-semibold placeholder:text-sm placeholder:font-normal`} />
                      </label>
                      <label className="mt-4 block text-xs font-bold text-[var(--kt-text)]">
                        Catatan <span className="font-normal text-[var(--kt-muted)]">(opsional)</span>
                        <textarea rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={`${fieldClass} resize-y p-3 font-normal`} placeholder="Contoh: pengiriman hari ini" />
                      </label>
                    </div>

                    <div className="rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-[var(--kt-muted)]">Stok saat ini</span>
                        <strong className="tabular-nums text-[var(--kt-text)]">{fmt(selected.totalStock)} unit</strong>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--kt-divider)] pt-3 text-sm">
                        <span className="text-[var(--kt-muted)]">Perkiraan setelah input</span>
                        <strong className={`text-right tabular-nums ${action === "sold" && Number(amount) > selected.totalStock ? "text-rose-500" : action === "add" ? "text-emerald-500" : "text-blue-500"}`}>
                          {amount && Number.isSafeInteger(Number(amount)) && Number(amount) > 0
                            ? fmt(action === "add" ? selected.totalStock + Number(amount) : selected.totalStock - Number(amount))
                            : fmt(selected.totalStock)}{" "}
                          unit
                        </strong>
                      </div>
                      {action === "sold" && Number(amount) > selected.totalStock && Number(amount) > 0 && (
                        <p className="mt-3 text-xs text-rose-500">Jumlah melebihi stok yang tersedia.</p>
                      )}
                    </div>

                    {error && !showEdit && !showAdd && (
                      <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>
                    )}

                    <button type="submit" disabled={saving} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 ${action === "add" ? "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/10 hover:from-emerald-500 hover:to-teal-500" : "bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-900/10 hover:from-rose-500 hover:to-pink-500"}`}>
                      {saving ? (
                        <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan transaksi...</>
                      ) : (
                        <><Icon name="check" size={17} />{action === "add" ? "Simpan Penambahan Stok" : "Simpan Penjualan"}</>
                      )}
                    </button>
                  </form>

                  {/* Riwayat stok */}
                  <div className="border-t border-[var(--kt-divider)] pt-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--kt-text)]">Riwayat Stok</h3>
                        <p className="mt-1 text-xs text-[var(--kt-muted)]">Catatan aktivitas toko ini.</p>
                      </div>
                      <button type="button" disabled={historyLoading} onClick={() => void loadHistory(selected.id)} className={`${secondaryButton} px-3 py-2 text-xs`}>
                        <Icon name="refresh" size={14} />Muat ulang
                      </button>
                    </div>

                    {historyLoading && (
                      <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="kt-skeleton h-28 rounded-xl" />)}</div>
                    )}

                    {historyError && !historyLoading && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-500">
                        <p>{historyError}</p>
                        <button type="button" onClick={() => void loadHistory(selected.id)} className="mt-2 font-bold underline underline-offset-4">Coba lagi</button>
                      </div>
                    )}

                    {!historyLoading && !historyError && history.length === 0 && (
                      <div className="rounded-xl border border-dashed border-[var(--kt-border)] bg-[var(--kt-subtle)] px-4 py-8 text-center">
                        <Icon name="clock" size={22} className="mx-auto text-[var(--kt-muted)]" />
                        <p className="mt-3 text-sm font-semibold text-[var(--kt-text)]">Belum ada riwayat transaksi</p>
                        <p className="mt-1 text-xs text-[var(--kt-muted)]">Aktivitas stok akan tampil di sini.</p>
                      </div>
                    )}

                    {!historyLoading && !historyError && history.length > 0 && (
                      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                        {history.map((item) => (
                          <article key={item.id} className="rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] p-4 transition hover:border-blue-500/25">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.type === "add" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"}`}>
                                  <Icon name={item.type === "add" ? "plus" : "arrow-down"} size={17} />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[var(--kt-text)]">{item.type === "add" ? "Stok ditambahkan" : "Stok terjual"}</p>
                                  <p className="mt-1 text-[11px] leading-5 text-[var(--kt-muted)]">{dateLabel(item.createdAt)}</p>
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-lg border px-2 py-1.5 text-[10px] font-bold sm:px-2.5 sm:text-xs ${item.type === "add" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-rose-500/20 bg-rose-500/10 text-rose-500"}`}>
                                {item.type === "add" ? "+" : "−"}{fmt(item.amount)} unit
                              </span>
                            </div>
                            {item.note && <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--kt-muted)]">{item.note}</p>}
                            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[var(--kt-divider)] pt-3">
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-[var(--kt-muted)]">Stok sebelum</p>
                                <p className="mt-1 text-sm font-bold text-[var(--kt-text)]">{fmt(item.stockBefore)} unit</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-[var(--kt-muted)]">Stok sesudah</p>
                                <p className="mt-1 text-sm font-bold text-[var(--kt-text)]">{fmt(item.stockAfter)} unit</p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>

<div className="overflow-hidden rounded-2xl border border-[var(--kt-border)]">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--kt-divider)] bg-[var(--kt-subtle)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]">Informasi toko</p>
                      <button type="button" onClick={openEditPartner} disabled={saving} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-2 text-xs font-bold text-blue-500 transition hover:bg-blue-500/15 disabled:opacity-50">
                        <Icon name="refresh" size={14} />
                        Edit Informasi
                      </button>
                    </div>

                    {([
                      ["Nama toko", selected.storeName, "store"],
                      ["Nama pemilik", selected.owner, "store"],
                      ["Nomor telepon", selected.phone, "phone"],
                      ["Alamat", selected.address, "map"],
                    ] as const).map(([label, value, icon]) => {
                      const displayValue = value?.trim() || "Belum diisi";

                      return (
                        <div key={label} className="kt-info-row flex items-start gap-3 border-b p-4 last:border-0">
                          <span className="mt-0.5 text-[var(--kt-muted)]"><Icon name={icon} size={16} /></span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] text-[var(--kt-muted)]">{label}</p>
                            {label === "Nomor telepon" && value?.trim() ? (
                              <a href={`tel:${value}`} className="mt-1 block break-words text-sm font-semibold text-blue-500 transition hover:text-blue-600">{displayValue}</a>
                            ) : (
                              <p className={`mt-1 break-words text-sm font-medium leading-6 ${value?.trim() ? "text-[var(--kt-text)]" : "text-[var(--kt-muted)] italic"}`}>{displayValue}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                  {/* Hapus toko */}
                  <div className="border-t border-[var(--kt-divider)] pt-5">
                    <button type="button" disabled={saving} onClick={() => { setError(""); setConfirmDelete(true); }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm font-bold text-rose-500 transition hover:border-rose-500/40 hover:bg-rose-500/10 disabled:opacity-40">
                      <Icon name="trash" size={16} />Hapus Toko
                    </button>
                    <p className="mt-2 text-center text-[11px] text-[var(--kt-muted)]">Pastikan toko yang dipilih sudah benar.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal edit informasi toko */}
      {showEdit && selected && (
        <div
          className="kt-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setShowEdit(false);
              setError("");
            }
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="edit-title" className="kt-modal-content kt-panel my-auto max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl">
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--kt-divider)] bg-[var(--kt-panel)] px-5 py-5 sm:px-7">
              <div className="flex min-w-0 items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-500"><Icon name="store" size={21} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-500">Pengaturan toko</p>
                  <h2 id="edit-title" className="mt-1 text-lg font-bold text-[var(--kt-text)]">Edit Informasi Toko</h2>
                  <p className="mt-1 break-words text-xs text-[var(--kt-muted)]">{selected.storeName}</p>
                </div>
              </div>
              <button type="button" disabled={saving} onClick={() => { setShowEdit(false); setError(""); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[var(--kt-border)] text-[var(--kt-muted)] transition hover:bg-[var(--kt-hover)] disabled:opacity-50" aria-label="Tutup edit toko">
                <Icon name="x" size={17} />
              </button>
            </header>

            <form onSubmit={savePartnerInfo} className="space-y-4 p-5 sm:p-7">
              <label className="block text-xs font-bold text-[var(--kt-text)]">
                Nama toko <span className="text-rose-500">*</span>
                <input autoFocus required maxLength={100} value={editForm.storeName} onChange={(e) => setEditForm((prev) => ({ ...prev, storeName: e.target.value }))} placeholder="Nama toko" className={`${fieldClass} h-12 font-normal`} />
              </label>

              <label className="block text-xs font-bold text-[var(--kt-text)]">
                Nama pemilik <span className="font-normal text-[var(--kt-muted)]">(Opsional)</span>
                <input maxLength={100} value={editForm.owner} onChange={(e) => setEditForm((prev) => ({ ...prev, owner: e.target.value }))} placeholder="Nama pemilik toko" className={`${fieldClass} h-12 font-normal`} />
              </label>

              <label className="block text-xs font-bold text-[var(--kt-text)]">
                Nomor telepon <span className="font-normal text-[var(--kt-muted)]">(Opsional)</span>
                <input type="tel" maxLength={30} value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="08xxxxxxxxxx" className={`${fieldClass} h-12 font-normal`} />
              </label>

              <label className="block text-xs font-bold text-[var(--kt-text)]">
                Alamat toko <span className="font-normal text-[var(--kt-muted)]">(Opsional)</span>
                <textarea maxLength={300} rows={3} value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Alamat lengkap toko" className={`${fieldClass} resize-y p-3 font-normal`} />
              </label>

              <p className="text-xs leading-5 text-[var(--kt-muted)]">
                Kolom bertanda * wajib diisi. Informasi lainnya boleh dikosongkan dan dilengkapi kapan saja.
              </p>

              {error && (
                <p role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-[var(--kt-divider)] pt-5 sm:flex-row">
                <button type="button" disabled={saving} onClick={() => { setShowEdit(false); setError(""); }} className={`${secondaryButton} flex-1`}>Batal</button>
                <button type="submit" disabled={saving} className={`${buttonBase} flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500`}>
                  {saving ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan...</>
                  ) : (
                    <><Icon name="check" size={16} />Simpan Perubahan</>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmDeleteDialog
        open={Boolean(confirmDelete && selected)}
        storeName={selected?.storeName ?? ""}
        error={error}
        saving={saving}
        onCancel={() => { setConfirmDelete(false); setError(""); }}
        onConfirm={removePartner}
      />

      <Toast
        message={notice}
        type={toastType}
        onClose={() => {
          if (noticeTimer.current) clearTimeout(noticeTimer.current);
          setNotice("");
        }}
      />

      <AddPartnerModal
        open={showAdd}
        saving={saving}
        error={error}
        onClose={() => { setShowAdd(false); setError(""); }}
        onSubmit={addPartner}
      />
    </main>
  );
}

export default Dashboard;
