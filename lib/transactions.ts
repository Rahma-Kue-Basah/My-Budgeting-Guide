import type {
  DashboardFilters,
  DashboardSummary,
  ParsePdfResult,
  TransactionRecord,
  TransactionType,
  UploadedPdfFile,
} from "@/types/transaction";

function normalizeDescription(description: string): string {
  return description.replace(/\s+/g, " ").trim().toLowerCase();
}

export function createStableId(seed: string): string {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

export function buildTransactionSignature(transaction: {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  balance: number | null;
}): string {
  return [
    transaction.date,
    normalizeDescription(transaction.description),
    transaction.type,
    transaction.amount.toFixed(2),
    transaction.balance ?? "no-balance",
  ].join("|");
}

export function mergeTransactions(
  currentTransactions: TransactionRecord[],
  incomingTransactions: TransactionRecord[]
): TransactionRecord[] {
  const map = new Map<string, TransactionRecord>();

  for (const transaction of currentTransactions) {
    map.set(buildTransactionSignature(transaction), transaction);
  }

  for (const transaction of incomingTransactions) {
    const signature = buildTransactionSignature(transaction);

    if (!map.has(signature)) {
      map.set(signature, transaction);
    }
  }

  return Array.from(map.values()).sort((left, right) =>
    right.date.localeCompare(left.date)
  );
}

export function mergeUploadedFiles(
  currentFiles: UploadedPdfFile[],
  incomingFile: UploadedPdfFile
): UploadedPdfFile[] {
  const withoutDuplicate = currentFiles.filter(
    (file) => file.id !== incomingFile.id
  );

  return [...withoutDuplicate, incomingFile].sort((left, right) =>
    right.addedAt.localeCompare(left.addedAt)
  );
}

export function summarizeTransactions(
  transactions: TransactionRecord[],
  uploadedFiles: UploadedPdfFile[]
): DashboardSummary {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "credit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "debit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const latestWithBalance = [...transactions]
    .sort((left, right) => right.date.localeCompare(left.date))
    .find((transaction) => transaction.balance !== null);

  return {
    totalTransactions: transactions.length,
    totalIncome,
    totalExpense,
    latestBalance: latestWithBalance?.balance ?? null,
    uploadedFiles: uploadedFiles.length,
  };
}

export function filterTransactions(
  transactions: TransactionRecord[],
  filters: DashboardFilters
): TransactionRecord[] {
  const searchQuery = filters.search.trim().toLowerCase();

  return transactions.filter((transaction) => {
    const matchesSearch =
      !searchQuery ||
      normalizeDescription(transaction.description).includes(searchQuery);
    const matchesType =
      filters.type === "all" || transaction.type === filters.type;
    const matchesStartDate =
      !filters.startDate || transaction.date >= filters.startDate;
    const matchesEndDate =
      !filters.endDate || transaction.date <= filters.endDate;

    return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
  });
}

export function createUploadedFileRecord(
  fileName: string,
  transactionCount: number
): UploadedPdfFile {
  const addedAt = new Date().toISOString();

  return {
    id: createStableId(`${fileName}|${addedAt}`),
    name: fileName,
    addedAt,
    transactionCount,
  };
}

export function mergeParseResults(results: ParsePdfResult[]): ParsePdfResult {
  return results.reduce<ParsePdfResult>(
    (accumulator, result) => ({
      transactions: mergeTransactions(
        accumulator.transactions,
        result.transactions
      ),
      warnings: [...accumulator.warnings, ...result.warnings],
    }),
    { transactions: [], warnings: [] }
  );
}
