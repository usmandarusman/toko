
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";

import { auth } from "../lib/firebase-client";
import { AuthContext } from "./AuthContext";

type Props = {
  children: ReactNode;
};

const DEFAULT_SHOP_NAME = "IncomeOn";
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const SHOP_NAME_KEY = "kt-shop-name";
const SHOP_LOGO_KEY = "kt-shop-logo";

export default function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [shopLogo, setShopLogo] = useState("");
  const [shopLoaded, setShopLoaded] = useState(false);

  const [setupComplete, setSetupComplete] = useState(false);
  const [setupName, setSetupName] = useState("");
  const [setupLogo, setSetupLogo] = useState("");
  const [setupError, setSetupError] = useState("");
  const [savingSetup, setSavingSetup] = useState(false);

  // Memeriksa sesi login Google.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  // Membaca identitas toko menggunakan key yang sama dengan Dashboard.
  useEffect(() => {
    if (!user) {
      setShopName(DEFAULT_SHOP_NAME);
      setShopLogo("");
      setShopLoaded(false);
      setSetupComplete(false);
      setSetupName("");
      setSetupLogo("");
      setSetupError("");
      return;
    }

    setShopLoaded(false);
    setSetupError("");

    try {
      // Key utama yang dipakai AuthGate dan Dashboard.
      let savedName = localStorage.getItem(SHOP_NAME_KEY)?.trim() || "";
      let savedLogo = localStorage.getItem(SHOP_LOGO_KEY) || "";

      // Kompatibilitas dengan key lama dari versi sebelumnya.
      const legacyName =
        localStorage.getItem(`kt-shop-name:${user.uid}`)?.trim() ||
        localStorage.getItem("shopName")?.trim() ||
        "";

      const legacyLogo =
        localStorage.getItem(`kt-shop-logo:${user.uid}`) ||
        localStorage.getItem("shopLogo") ||
        "";

      // Migrasikan nilai lama hanya jika key utama belum memiliki nilai.
      // Jangan menimpa data utama yang sudah ada dengan data lama.
      if (!savedName && legacyName) {
        localStorage.setItem(SHOP_NAME_KEY, legacyName);
        savedName = legacyName;
      }

      if (!savedLogo && legacyLogo) {
        localStorage.setItem(SHOP_LOGO_KEY, legacyLogo);
        savedLogo = legacyLogo;
      }

      setShopName(savedName || DEFAULT_SHOP_NAME);
      setShopLogo(savedLogo);

      setSetupName(savedName);
      setSetupLogo(savedLogo);

      // Setup hanya dilewati jika nama dan logo sama-sama tersedia.
      setSetupComplete(Boolean(savedName && savedLogo));
    } catch (err) {
      console.error("Gagal membaca identitas toko:", err);

      // Jangan menghapus data saat terjadi kegagalan membaca/menulis.
      // Jika identitas sebelumnya sudah terbaca, pertahankan nilainya.
      setSetupComplete(false);
    } finally {
      setShopLoaded(true);
    }
  }, [user]);

  async function login() {
    setBusy(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login Google gagal:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Login Google gagal. Silakan coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setError("");

    try {
      await signOut(auth);
    } catch (err) {
      console.error("Gagal logout:", err);

      setError("Gagal keluar dari akun. Silakan coba lagi.");
      throw err;
    }
  }

  // Menyimpan identitas toko ke key yang tetap.
  // Pemanggilan setItem pada key yang sama akan menimpa nilainya.
  function updateShopIdentity({
    shopName: nextName,
    shopLogo: nextLogo,
  }: {
    shopName: string;
    shopLogo: string;
  }) {
    if (!user) {
      throw new Error("Silakan login terlebih dahulu.");
    }

    const name = nextName.trim();

    if (!name) {
      throw new Error("Nama toko wajib diisi.");
    }

    if (name.length > 80) {
      throw new Error("Nama toko maksimal 80 karakter.");
    }

    if (!nextLogo) {
      throw new Error("Logo toko wajib dipilih.");
    }

    try {
      const previousName = localStorage.getItem(SHOP_NAME_KEY);
      const previousLogo = localStorage.getItem(SHOP_LOGO_KEY);

      try {
        // Selalu gunakan dua key yang sama.
        localStorage.setItem(SHOP_NAME_KEY, name);
        localStorage.setItem(SHOP_LOGO_KEY, nextLogo);
      } catch (storageError) {
        // Coba pulihkan nilai sebelumnya jika penyimpanan gagal.
        try {
          if (previousName === null) {
            localStorage.removeItem(SHOP_NAME_KEY);
          } else {
            localStorage.setItem(SHOP_NAME_KEY, previousName);
          }

          if (previousLogo === null) {
            localStorage.removeItem(SHOP_LOGO_KEY);
          } else {
            localStorage.setItem(SHOP_LOGO_KEY, previousLogo);
          }
        } catch (rollbackError) {
          console.error(
            "Gagal memulihkan identitas toko:",
            rollbackError
          );
        }

        throw storageError;
      }

      setShopName(name);
      setShopLogo(nextLogo);
      setSetupName(name);
      setSetupLogo(nextLogo);
    } catch (err) {
      console.error("Gagal menyimpan identitas toko:", err);

      throw new Error(
        "Gagal menyimpan nama atau logo. Coba gunakan gambar yang lebih kecil."
      );
    }
  }

  async function completeShopSetup() {
    setSetupError("");

    const name = setupName.trim();

    if (!name) {
      setSetupError("Nama toko wajib diisi.");
      return;
    }

    if (name.length > 80) {
      setSetupError("Nama toko maksimal 80 karakter.");
      return;
    }

    if (!setupLogo) {
      setSetupError("Silakan pilih logo toko terlebih dahulu.");
      return;
    }

    setSavingSetup(true);

    try {
      updateShopIdentity({
        shopName: name,
        shopLogo: setupLogo,
      });

      setSetupComplete(true);
    } catch (err) {
      setSetupError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan identitas toko."
      );
    } finally {
      setSavingSetup(false);
    }
  }

  function handleLogoChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setSetupError("");

    if (!file.type.startsWith("image/")) {
      setSetupError("File harus berupa gambar.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setSetupError(
        "Ukuran logo maksimal 5 MB. Silakan pilih gambar yang lebih kecil."
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSetupLogo(reader.result);
      } else {
        setSetupError("Gagal membaca gambar. Silakan coba lagi.");
      }
    };

    reader.onerror = () => {
      setSetupError("Gagal membaca gambar. Silakan coba lagi.");
    };

    reader.readAsDataURL(file);
  }

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070b14] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
          <p className="mt-4 text-sm text-slate-300">
            Memeriksa sesi login...
          </p>
        </div>
      </main>
    );
  }

  // Halaman login Google.
  if (!user) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070b14] px-5 py-10 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[110px]" />
          <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-indigo-500/15 blur-[110px]" />

          <div
            className="absolute inset-0 opacity-[0.09]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.2) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <section className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/75 p-7 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-9">
          <div className="mb-8 grid h-14 w-14 place-items-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-blue-300">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M3 10h18l-2-7H5l-2 7Z" />
              <path d="M5 10v10h14V10M9 20v-6h6v6" />
              <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
            </svg>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-blue-300">
            IncomeOn workspace
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Masuk ke dashboard
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Gunakan akun Google untuk mengakses dan mengelola data toko.
          </p>

          {error && (
            <p
              role="alert"
              className="mt-5 break-words rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => void login()}
            disabled={busy}
            className="mt-7 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            ) : (
              <svg
                viewBox="0 0 48 48"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.82 46.98 24.55Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                />
              </svg>
            )}

            {busy ? "Menghubungkan akun..." : "Lanjutkan dengan Google"}
          </button>

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            Akses dashboard hanya tersedia setelah autentikasi berhasil.
          </p>
        </section>
      </main>
    );
  }

  if (!shopLoaded) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#070b14] text-white">
        <div className="text-center">
          <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
          <p className="mt-4 text-sm text-slate-400">
            Memuat identitas toko...
          </p>
        </div>
      </main>
    );
  }

  // Halaman setup wajib sebelum dashboard.
  if (!setupComplete) {
    return (
      <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#070b14] px-5 py-10 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[110px]" />
          <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.2) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <section className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-9">
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden="true"
            >
              <path d="M3 10h18l-2-7H5l-2 7Z" />
              <path d="M5 10v10h14V10" />
              <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
            </svg>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">
            Workspace setup
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Siapkan toko kamu
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Lengkapi nama dan logo toko sebelum mulai menggunakan IncomeOn.
          </p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              void completeShopSetup();
            }}
          >
            <div>
              <label
                htmlFor="setup-shop-name"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Nama toko
              </label>

              <input
                id="setup-shop-name"
                type="text"
                value={setupName}
                onChange={(event) => setSetupName(event.target.value)}
                placeholder="Contoh: Toko Berkah"
                maxLength={80}
                autoComplete="organization"
                required
                className="min-h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-400/10"
              />
            </div>

            <div>
              <label
                htmlFor="setup-shop-logo"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Logo toko
              </label>

              <label
                htmlFor="setup-shop-logo"
                className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-slate-950/40 px-5 py-7 text-center transition hover:border-cyan-400/50 hover:bg-cyan-400/5"
              >
                {setupLogo ? (
                  <img
                    src={setupLogo}
                    alt="Preview logo toko"
                    className="h-24 w-24 rounded-2xl border border-white/10 bg-white/5 object-contain p-2"
                  />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-slate-400">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      aria-hidden="true"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}

                <span className="mt-4 text-sm font-medium text-slate-200">
                  {setupLogo ? "Ganti logo toko" : "Pilih gambar logo"}
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  PNG, JPG, WEBP, atau GIF · Maksimal 5 MB
                </span>
              </label>

              <input
                id="setup-shop-logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={handleLogoChange}
              />
            </div>

            {setupError && (
              <p
                role="alert"
                className="break-words rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200"
              >
                {setupError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingSetup}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSetup ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Menyimpan identitas...
                </>
              ) : (
                "Simpan dan masuk dashboard"
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void logout().catch(() => {})}
            className="mt-4 w-full rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            Keluar dari akun
          </button>

          <p className="mt-4 text-center text-xs leading-5 text-slate-500">
            Identitas toko disimpan di browser ini.
          </p>
        </section>
      </main>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        logout,
        shopName,
        shopLogo,
        updateShopIdentity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
