"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { TransactionRecord } from "@/types/transaction";

interface TransactionTableProps {
  transactions: TransactionRecord[];
}

const PAGE_SIZE = 12;

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const sortedTransactions = useMemo(() => {
    const cloned = [...transactions];
    cloned.sort((left, right) =>
      sortDirection === "desc"
        ? right.date.localeCompare(left.date)
        : left.date.localeCompare(right.date)
    );

    return cloned;
  }, [sortDirection, transactions]);

  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleTransactions = sortedTransactions.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
      <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Tabel transaksi</h2>
          <p className="text-sm text-slate-600">
            {transactions.length} transaksi setelah filter diterapkan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSortDirection((current) => (current === "desc" ? "asc" : "desc"))}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          Sort tanggal: {sortDirection === "desc" ? "Terbaru" : "Terlama"}
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-medium">Tanggal</th>
              <th className="px-5 py-3 font-medium">Deskripsi</th>
              <th className="px-5 py-3 font-medium">Tipe</th>
              <th className="px-5 py-3 font-medium">Nominal</th>
              <th className="px-5 py-3 font-medium">Saldo</th>
              <th className="px-5 py-3 font-medium">File asal</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-t border-slate-100 align-top text-slate-700"
              >
                <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-950">
                  {formatDate(transaction.date)}
                </td>
                <td className="max-w-xl px-5 py-4">
                  <p className="font-medium text-slate-950">
                    {transaction.description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{transaction.rawLine}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                      transaction.type === "credit"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-rose-50 text-rose-800",
                    ].join(" ")}
                  >
                    {transaction.type}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-950">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  {formatCurrency(transaction.balance)}
                </td>
                <td className="px-5 py-4 text-slate-600">{transaction.sourceFile}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          Belum ada transaksi yang cocok dengan filter aktif.
        </div>
      ) : null}

      {transactions.length > 0 ? (
        <footer className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
          <p>
            Halaman {safePage} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="rounded-full border border-slate-300 px-4 py-2 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              className="rounded-full border border-slate-300 px-4 py-2 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
