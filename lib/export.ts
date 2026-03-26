import { formatCurrency, formatDate } from "@/lib/formatters";
import type { DashboardSummary, TransactionRecord } from "@/types/transaction";

function escapeCsvValue(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function downloadBlob(content: string, fileName: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportTransactionsCsv(transactions: TransactionRecord[]) {
  const header = [
    "Tanggal",
    "Deskripsi",
    "Tipe",
    "Nominal",
    "Saldo",
    "File Asal",
    "Raw Line",
  ];

  const rows = transactions.map((transaction) => [
    formatDate(transaction.date),
    transaction.description,
    transaction.type,
    transaction.amount.toString(),
    transaction.balance?.toString() ?? "",
    transaction.sourceFile,
    transaction.rawLine,
  ]);

  const csvContent = [header, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  downloadBlob(
    csvContent,
    `mutasi-bca-export-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8;"
  );
}

export function exportSummaryCsv(summary: DashboardSummary) {
  const rows = [
    ["Metrik", "Nilai"],
    ["Total transaksi", String(summary.totalTransactions)],
    ["Total pemasukan", formatCurrency(summary.totalIncome)],
    ["Total pengeluaran", formatCurrency(summary.totalExpense)],
    ["Saldo terakhir", formatCurrency(summary.latestBalance)],
    ["Jumlah file PDF", String(summary.uploadedFiles)],
  ];

  const csvContent = rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");

  downloadBlob(
    csvContent,
    `mutasi-bca-summary-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8;"
  );
}
