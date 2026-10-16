 "use client";

import type { FormEvent } from "react";

type Props = {
  open: boolean;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = `${buttonBase} border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] hover:bg-[var(--kt-hover)]`;
const fieldClass = "kt-field mt-2 w-full rounded-xl border border-[var(--kt-border)] bg-[var(--kt-input)] px-3 text-sm text-[var(--kt-text)] outline-none transition placeholder:text-[var(--kt-muted)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const fields = [
  ["storeName", "Nama toko", 100],
  ["owner", "Nama pemilik", 100],
  ["phone", "Nomor telepon", 30],
  ["address", "Alamat toko", 300],
] as const;

export default function AddPartnerModal({ open, saving, error, onClose, onSubmit }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="add-store-title"
        className="kt-panel my-auto w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--kt-divider)] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-blue-500">
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M5 10v10h14V10M9 20v-6h6v6" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></svg>
            </div>
            <div>
              <h3 id="add-store-title" className="text-lg font-bold text-[var(--kt-text)]">Tambah Toko Baru</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--kt-muted)]">Lengkapi informasi mitra yang ingin didaftarkan.</p>
            </div>
          </div>
          <button type="button" disabled={saving} onClick={onClose}
            className="rounded-xl p-2 text-[var(--kt-muted)] transition hover:bg-[var(--kt-subtle)] hover:text-[var(--kt-text)] disabled:opacity-50" aria-label="Tutup popup">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m18 6-12 12M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([name, label, maxLength]) => {
              const required = name === "storeName";
              return <label key={name} className="block text-xs font-bold text-[var(--kt-text)]">
                <span className="mb-2 flex flex-wrap items-center gap-2">
                  {label}
                  {required ? <span className="text-rose-500">*</span> : <span className="font-normal text-[var(--kt-muted)]">(Opsional)</span>}
                </span>
                {name === "address"
                  ? <textarea name={name} required={required} maxLength={maxLength} rows={3}
                      placeholder="Alamat lengkap toko (opsional)" className={`${fieldClass} resize-y p-3 font-normal`} />
                  : <input name={name} required={required} maxLength={maxLength}
                      type={name === "phone" ? "tel" : "text"}
                      placeholder={name === "storeName" ? "Contoh: Toko Berkah" : name === "owner" ? "Nama pemilik toko" : "08xxxxxxxxxx"}
                      className={`${fieldClass} h-12 font-normal`} />}
              </label>;
            })}
          </div>
          {error && <div role="alert" className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</div>}
          <div className="flex flex-col-reverse gap-3 border-t border-[var(--kt-divider)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" disabled={saving} onClick={onClose} className={secondaryButton}>Batal</button>
            <button type="submit" disabled={saving} className={`${buttonBase} bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60`}>
              {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menyimpan...</> : <>Simpan Toko</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
