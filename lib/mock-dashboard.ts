import type { TransactionRecord } from "@/types/transaction";

export interface MockFileRecord {
  id: string;
  name: string;
  addedAt: string;
  transactionCount: number;
  sizeLabel: string;
  status: "Processed" | "Pending review" | "Ready";
}

export interface SummaryMetric {
  label: string;
  value: number;
  note: string;
  accent: string;
}

export const summaryMetrics: SummaryMetric[] = [
  {
    label: "Total transaksi",
    value: 284,
    note: "Naik 12% dari batch sebelumnya",
    accent: "from-violet-500/18 via-fuchsia-500/10 to-transparent",
  },
  {
    label: "Total pemasukan",
    value: 184_325_900,
    note: "Transfer masuk dan settlement",
    accent: "from-cyan-500/18 via-sky-500/10 to-transparent",
  },
  {
    label: "Total pengeluaran",
    value: 63_490_200,
    note: "Operasional dan pembayaran vendor",
    accent: "from-pink-500/18 via-rose-500/10 to-transparent",
  },
  {
    label: "Saldo akhir",
    value: 42_618_470,
    note: "Snapshot saldo pada file terbaru",
    accent: "from-indigo-500/18 via-violet-500/10 to-transparent",
  },
];

export const mockFiles: MockFileRecord[] = [
  {
    id: "file-jan",
    name: "Mutasi-BCA-Januari-2026.pdf",
    addedAt: "2026-03-25T09:42:00.000Z",
    transactionCount: 112,
    sizeLabel: "2.4 MB",
    status: "Processed",
  },
  {
    id: "file-feb",
    name: "Mutasi-BCA-Februari-2026.pdf",
    addedAt: "2026-03-25T10:18:00.000Z",
    transactionCount: 96,
    sizeLabel: "1.9 MB",
    status: "Processed",
  },
  {
    id: "file-mar-1",
    name: "Mutasi-BCA-Maret-2026-Batch-1.pdf",
    addedAt: "2026-03-26T07:30:00.000Z",
    transactionCount: 48,
    sizeLabel: "1.2 MB",
    status: "Ready",
  },
  {
    id: "file-mar-2",
    name: "Mutasi-BCA-Maret-2026-Batch-2.pdf",
    addedAt: "2026-03-26T11:05:00.000Z",
    transactionCount: 28,
    sizeLabel: "860 KB",
    status: "Pending review",
  },
];

export const mockTransactions: TransactionRecord[] = [
  {
    id: "tx-1",
    date: "2026-03-26",
    description: "TRSF E-BANKING / Invoice campaign creator batch 01",
    type: "credit",
    amount: 12_500_000,
    balance: 42_618_470,
    sourceFile: "Mutasi-BCA-Maret-2026-Batch-2.pdf",
    rawLine: "26/03 TRSF E-BANKING CR 12,500,000.00 42,618,470.00",
  },
  {
    id: "tx-2",
    date: "2026-03-26",
    description: "BI-FAST / Pembayaran vendor produksi livestream",
    type: "debit",
    amount: 4_250_000,
    balance: 30_118_470,
    sourceFile: "Mutasi-BCA-Maret-2026-Batch-2.pdf",
    rawLine: "26/03 BI-FAST DB 4,250,000.00 30,118,470.00",
  },
  {
    id: "tx-3",
    date: "2026-03-25",
    description: "QRIS settlement / Penjualan digital product",
    type: "credit",
    amount: 8_920_500,
    balance: 34_368_470,
    sourceFile: "Mutasi-BCA-Maret-2026-Batch-1.pdf",
    rawLine: "25/03 QRIS SETTLEMENT CR 8,920,500.00 34,368,470.00",
  },
  {
    id: "tx-4",
    date: "2026-03-24",
    description: "Autodebet / Langganan tool analytics",
    type: "debit",
    amount: 799_000,
    balance: 25_447_970,
    sourceFile: "Mutasi-BCA-Maret-2026-Batch-1.pdf",
    rawLine: "24/03 AUTODEBET DB 799,000.00 25,447,970.00",
  },
  {
    id: "tx-5",
    date: "2026-03-23",
    description: "TRSF E-BANKING / Payout sponsor bulanan",
    type: "credit",
    amount: 25_000_000,
    balance: 26_246_970,
    sourceFile: "Mutasi-BCA-Februari-2026.pdf",
    rawLine: "23/03 TRSF E-BANKING CR 25,000,000.00 26,246,970.00",
  },
  {
    id: "tx-6",
    date: "2026-03-22",
    description: "Pembayaran payroll / Tim operasional",
    type: "debit",
    amount: 9_850_000,
    balance: 1_246_970,
    sourceFile: "Mutasi-BCA-Februari-2026.pdf",
    rawLine: "22/03 PAYROLL DB 9,850,000.00 1,246,970.00",
  },
  {
    id: "tx-7",
    date: "2026-03-21",
    description: "VA incoming / Pembayaran member premium",
    type: "credit",
    amount: 3_420_000,
    balance: 11_096_970,
    sourceFile: "Mutasi-BCA-Februari-2026.pdf",
    rawLine: "21/03 VA INCOMING CR 3,420,000.00 11,096,970.00",
  },
  {
    id: "tx-8",
    date: "2026-03-20",
    description: "Transfer keluar / Cashback affiliate program",
    type: "debit",
    amount: 2_175_000,
    balance: 7_676_970,
    sourceFile: "Mutasi-BCA-Januari-2026.pdf",
    rawLine: "20/03 TRSF KELUAR DB 2,175,000.00 7,676,970.00",
  },
];

export const quickActions = [
  {
    label: "Upload PDF",
    description: "Tambahkan batch mutasi baru dari desktop Anda.",
    href: "/file/upload",
  },
  {
    label: "Tambah PDF Lagi",
    description: "Gabungkan file tambahan tanpa reset data sebelumnya.",
    href: "/file/upload",
  },
  {
    label: "Export CSV",
    description: "Unduh data transaksi ke format yang siap dipakai.",
    href: "/export",
  },
  {
    label: "Reset Data",
    description: "Mulai ulang workspace bila ingin parsing dari awal.",
    href: "/settings",
  },
] as const;
