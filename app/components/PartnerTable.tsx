 "use client";

import type { Partner, SortBy } from "../types/partner";
import { fmt } from "../lib/partner-utils";

type Props = {
  partners: Partner[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortBy;
  onSortChange: (value: SortBy) => void;
  sortAsc: boolean;
  onToggleSort: () => void;
  onOpen: (partnerId: string) => void;
};

const fieldClass =
  "kt-field mt-2 w-full rounded-xl border border-[var(--kt-border)] bg-[var(--kt-input)] px-3 text-sm text-[var(--kt-text)] outline-none transition placeholder:text-[var(--kt-muted)] focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] px-4 py-3 text-sm font-semibold text-[var(--kt-text)] transition hover:bg-[var(--kt-hover)]";

export default function PartnerTable({
  partners, loading, search, onSearchChange, sortBy, onSortChange,
  sortAsc, onToggleSort, onOpen,
}: Props) {
  return (
    <section className="kt-panel overflow-hidden rounded-3xl">
      <div className="border-b border-[var(--kt-divider)] p-5 sm:p-6 lg:p-7">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-cyan-400" />
          <h3 className="text-lg font-bold tracking-tight text-[var(--kt-text)]">Daftar Toko</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--kt-muted)]">
          Pilih toko untuk melihat detail, mengelola stok, dan membuka riwayat.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-b border-[var(--kt-divider)] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-md">
          <label htmlFor="store-search" className="mb-2 block text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]">
            Pencarian
          </label>
          <div className="relative">
            <svg aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kt-muted)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            <input id="store-search" type="search" value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama toko..." className={`${fieldClass} h-12 pl-11 pr-10`} />
            {search && <button type="button" onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[var(--kt-muted)] transition hover:text-blue-500"
              aria-label="Hapus pencarian">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m18 6-12 12M6 6l12 12" /></svg>
            </button>}
          </div>
        </div>

        <div className="flex w-full items-end justify-end gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-none">
            <label htmlFor="sort-by" className="block text-[10px] font-bold uppercase tracking-[.15em] text-[var(--kt-muted)]">Sort by</label>
            <select id="sort-by" value={sortBy} onChange={(e) => onSortChange(e.target.value as SortBy)}
              className={`${fieldClass} h-12 w-full sm:w-48`}>
              <option value="name">Nama toko</option>
              <option value="stock">Jumlah stok</option>
            </select>
          </div>
          <button type="button" onClick={onToggleSort}
            aria-label={sortAsc ? "Urutan naik, klik untuk urutan turun" : "Urutan turun, klik untuk urutan naik"}
            title={sortAsc ? "Urutan naik" : "Urutan turun"} className={`${secondaryButton} h-12 shrink-0 gap-2`}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {sortAsc ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14m-7-7 7 7 7-7" />}
            </svg>
            <span>{sortAsc ? "Asc" : "Des"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="kt-table-scroll rounded-2xl border border-[var(--kt-border)]">
          <table className="w-full table-fixed text-left">
            <thead><tr className="border-b border-[var(--kt-divider)] bg-[var(--kt-subtle)] text-[10px] uppercase tracking-wider text-[var(--kt-muted)] sm:text-xs">
              <th className="w-10 px-2 py-3 font-bold sm:w-16 sm:px-5 sm:py-4">No.</th>
              <th className="px-2 py-3 font-bold sm:px-5 sm:py-4">Nama Toko</th>
              <th className="w-[108px] px-2 py-3 text-right font-bold sm:w-36 sm:px-5 sm:py-4">Total Stok</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--kt-divider)]">
              {loading && Array.from({ length: 6 }).map((_, i) => <tr key={i}>
                <td className="px-2 py-5 sm:px-5"><div className="kt-skeleton h-4 w-5 rounded" /></td>
                <td className="px-2 py-5 sm:px-5"><div className="space-y-2"><div className="kt-skeleton h-3.5 w-24 max-w-full rounded sm:w-36" /><div className="kt-skeleton h-3 w-20 max-w-full rounded sm:w-24" /></div></td>
                <td className="px-2 py-5 sm:px-5"><div className="kt-skeleton ml-auto h-6 w-14 rounded-lg sm:w-20" /></td>
              </tr>)}
              {!loading && partners.map((partner, index) => <tr key={partner.id}
                className="group cursor-pointer transition-colors duration-200 hover:bg-blue-500/[.045]"
                onClick={() => onOpen(partner.id)}>
                <td className="px-2 py-4 text-[10px] tabular-nums text-[var(--kt-muted)] sm:px-5 sm:py-5 sm:text-xs">{String(index + 1).padStart(2, "0")}</td>
                <td className="min-w-0 px-2 py-4 sm:px-5 sm:py-5">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(partner.id); }} className="block w-full min-w-0 text-left">
                    <span className="block truncate text-xs font-bold text-[var(--kt-text)] transition group-hover:text-blue-500 sm:text-sm">{partner.storeName}</span>
                    
                  </button>
                </td>
                <td className="px-2 py-4 text-right sm:px-5 sm:py-5">
                  <span className={`inline-flex max-w-full items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-[10px] font-bold tabular-nums sm:gap-1.5 sm:px-2.5 sm:text-xs ${partner.totalStock > 0 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" : "border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-muted)]"}`}>
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${partner.totalStock > 0 ? "bg-emerald-500" : "bg-slate-400"}`} />
                    <span className="whitespace-nowrap">{fmt(partner.totalStock)} unit</span>
                  </span>
                </td>
              </tr>)}
              {!loading && partners.length === 0 && <tr><td colSpan={3} className="px-3 py-14 text-center sm:px-5 sm:py-16">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--kt-border)] bg-[var(--kt-subtle)] text-[var(--kt-muted)]">
                  <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
                </span>
                <p className="mt-4 text-sm font-bold text-[var(--kt-text)]">{search ? "Toko tidak ditemukan" : "Belum ada toko"}</p>
                <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-[var(--kt-muted)]">{search ? "Coba kata kunci lain." : "Tambahkan toko pertama melalui section Tambah Toko."}</p>
              </td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-[var(--kt-muted)]">Menampilkan {partners.length} toko</span>
          {partners.length > 6 && <span className="inline-flex items-center gap-2 text-xs text-[var(--kt-muted)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14m-7-7 7 7 7-7" /></svg>
            Gulir ke bawah untuk melihat toko lainnya
          </span>}
        </div>
      </div>
    </section>
  );
}
