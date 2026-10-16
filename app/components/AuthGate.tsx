
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

const DEFAULT_SHOP_NAME = "Kerupuk Tahu";

export default function AuthGate({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [shopName, setShopName] = useState(DEFAULT_SHOP_NAME);
  const [shopLogo, setShopLogo] = useState("");
  const [shopLoaded, setShopLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return unsubscribe;
  }, []);

  // Ambil identitas lokal sesuai akun Google yang sedang login.
  useEffect(() => {
    if (!user) {
      setShopName(DEFAULT_SHOP_NAME);
      setShopLogo("");
      setShopLoaded(false);
      return;
    }

    setShopLoaded(false);

    try {
      const savedName = localStorage.getItem(
        `kt-shop-name:${user.uid}`
      );

      const savedLogo = localStorage.getItem(
        `kt-shop-logo:${user.uid}`
      );

      setShopName(savedName?.trim() || DEFAULT_SHOP_NAME);
      setShopLogo(savedLogo || "");
    } catch (err) {
      console.error("Gagal membaca identitas toko:", err);
      setShopName(DEFAULT_SHOP_NAME);
      setShopLogo("");
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

  // Simpan nama dan logo lokal untuk akun yang sedang login.
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

    const nameKey = `kt-shop-name:${user.uid}`;
    const logoKey = `kt-shop-logo:${user.uid}`;

    try {
      localStorage.setItem(nameKey, name);

      if (nextLogo) {
        localStorage.setItem(logoKey, nextLogo);
      } else {
        localStorage.removeItem(logoKey);
      }

      setShopName(name);
      setShopLogo(nextLogo);
    } catch (err) {
      console.error("Gagal menyimpan identitas toko:", err);

      throw new Error(
        "Gagal menyimpan identitas. Coba gunakan logo yang lebih kecil."
      );
    }
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
            Secure workspace
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
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />
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
