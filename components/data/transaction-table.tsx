"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { TransactionRecord } from "@/types/transaction";

const PAGE_SIZE = 12;

export function DataTransactionTable({
  transactions,
}: {
  transactions: TransactionRecord[];
}) {
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
    <div className="overflow-hidden rounded-[28px] border border-[rgba(221,228,239,0.78)] bg-white/90 shadow-[0_14px_36px_rgba(16,24,40,0.05)]">
      <div className="flex items-center justify-between border-b border-[rgba(221,228,239,0.78)] px-6 py-5">
        <p className="text-sm text-slate-500">
          {transactions.length} transaksi setelah filter.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
          }
          className="rounded-2xl border-[rgba(221,228,239,0.82)] bg-white"
        >
          Sort: {sortDirection === "desc" ? "Terbaru" : "Terlama"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="border-b border-[rgba(221,228,239,0.72)] bg-[#f8faff] hover:bg-[#f8faff]">
            <TableHead>Tanggal</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>File</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleTransactions.map((transaction) => (
            <TableRow key={transaction.id} className="border-[rgba(226,232,240,0.65)]">
              <TableCell className="whitespace-nowrap font-medium text-slate-900">
                {formatDate(transaction.date)}
              </TableCell>
              <TableCell className="min-w-80">
                <p className="font-medium text-slate-900">{transaction.description}</p>
                <p className="mt-1 text-xs text-slate-500">{transaction.rawLine}</p>
              </TableCell>
              <TableCell>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    transaction.type === "credit"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {transaction.type}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-slate-500">
                {formatCurrency(transaction.balance)}
              </TableCell>
              <TableCell className="whitespace-nowrap text-slate-500">
                {transaction.sourceFile}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {transactions.length === 0 ? (
        <div className="px-5 py-12 text-center text-sm text-slate-500">
          Belum ada transaksi.
        </div>
      ) : (
        <div className="flex items-center justify-between border-t border-[rgba(221,228,239,0.78)] px-6 py-5">
          <p className="text-sm text-slate-500">
            Halaman {safePage} dari {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="rounded-2xl border-[rgba(221,228,239,0.82)] bg-white"
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={safePage >= totalPages}
              className="rounded-2xl border-[rgba(221,228,239,0.82)] bg-white"
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
