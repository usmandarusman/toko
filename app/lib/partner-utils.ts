import { auth } from "./firebase-client";

export const fmt = (n: number) => n.toLocaleString("id-ID");

export function dateLabel(value: string) {
  if (!value) return "Belum ada aktivitas";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Belum ada aktivitas"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export function cleanText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

/**
 * Semua request API dari dashboard dikirim dengan Firebase ID token.
 * Route Handler wajib memverifikasi token dan membatasi data berdasarkan UID.
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");

  const token = await user.getIdToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${token}`,
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
