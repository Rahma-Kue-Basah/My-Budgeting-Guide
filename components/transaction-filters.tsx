"use client";

import type { DashboardFilters } from "@/types/transaction";

interface TransactionFiltersProps {
  filters: DashboardFilters;
  onChange: (filters: DashboardFilters) => void;
  onReset: () => void;
}

export function TransactionFilters({
  filters,
  onChange,
  onReset,
}: TransactionFiltersProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Cari deskripsi</span>
          <input
            type="search"
            value={filters.search}
            onChange={(event) =>
              onChange({ ...filters, search: event.target.value })
            }
            placeholder="Contoh: transfer, biaya admin, gaji"
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none ring-0 transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
          />
        </label>

        <label className="flex min-w-44 flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Tipe transaksi</span>
          <select
            value={filters.type}
            onChange={(event) =>
              onChange({
                ...filters,
                type: event.target.value as DashboardFilters["type"],
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            <option value="all">Semua</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </label>

        <label className="flex min-w-40 flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Dari tanggal</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              onChange({ ...filters, startDate: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </label>

        <label className="flex min-w-40 flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">Sampai tanggal</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) =>
              onChange({ ...filters, endDate: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </label>

        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          Reset filter
        </button>
      </div>
    </section>
  );
}
