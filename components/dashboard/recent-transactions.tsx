import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionRecord } from "@/types/transaction";

export function RecentTransactions({
  transactions,
}: {
  transactions: TransactionRecord[];
}) {
  return (
    <Card className="rounded-[24px] border-white/70 bg-white/85">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent transactions</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Preview transaksi terbaru dari batch PDF yang sudah diproses.
          </p>
        </div>
        <Link
          href="/data"
          className="inline-flex items-center gap-2 text-sm font-medium text-violet-700"
        >
          Lihat detail
          <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
              <TableHead>Tanggal</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Nominal</TableHead>
              <TableHead>Saldo</TableHead>
              <TableHead>File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.slice(0, 5).map((transaction) => (
              <TableRow key={transaction.id} className="border-slate-100">
                <TableCell className="whitespace-nowrap font-medium text-slate-900">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="min-w-80">
                  <p className="font-medium text-slate-900">
                    {transaction.description}
                  </p>
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
          <div className="px-6 py-10 text-sm text-slate-500">
            Belum ada transaksi untuk ditampilkan.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
