export type TransactionType = "debit" | "credit";

export interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number | null;
  sourceFile: string;
  rawLine: string;
}

export interface UploadedPdfFile {
  id: string;
  name: string;
  addedAt: string;
  transactionCount: number;
}

export interface DashboardFilters {
  search: string;
  type: "all" | TransactionType;
  startDate: string;
  endDate: string;
}

export interface DashboardSummary {
  totalTransactions: number;
  totalIncome: number;
  totalExpense: number;
  latestBalance: number | null;
  uploadedFiles: number;
}

export interface StoredDashboardState {
  transactions: TransactionRecord[];
  uploadedFiles: UploadedPdfFile[];
  lastUpdatedAt: string | null;
}

export interface ParsePdfResult {
  transactions: TransactionRecord[];
  warnings: string[];
}
