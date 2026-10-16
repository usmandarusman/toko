 "use client";

type Props = {
  open: boolean;
  storeName: string;
  error: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const buttonBase = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButton = `${buttonBase} border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-text)] hover:bg-[var(--kt-hover)]`;

export default function ConfirmDeleteDialog({ open, storeName, error, saving, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return <div className="kt-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
    <section role="alertdialog" aria-modal="true" aria-labelledby="delete-title" className="kt-modal-content kt-panel w-full max-w-md overflow-hidden rounded-3xl">
      <div className="p-5 sm:p-7">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
        </div>
        <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-rose-500">Konfirmasi tindakan</p>
        <h3 id="delete-title" className="mt-2 text-xl font-bold text-[var(--kt-text)]">Hapus toko ini?</h3>
        <p className="mt-3 text-sm leading-6 text-[var(--kt-muted)]">Yakin ingin menghapus <strong className="text-[var(--kt-text)]">{storeName}</strong>? Tindakan ini tidak bisa dibatalkan.</p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-500">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
          <button type="button" disabled={saving} onClick={onCancel} className={`${secondaryButton} flex-1`}>Batal</button>
          <button type="button" disabled={saving} onClick={onConfirm} className={`${buttonBase} flex-1 bg-gradient-to-r from-rose-600 to-red-600 text-white hover:from-rose-500 hover:to-red-500`}>
            {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Menghapus...</> : <>Ya, Hapus</>}
          </button>
        </div>
      </div>
    </section>
  </div>;
}
