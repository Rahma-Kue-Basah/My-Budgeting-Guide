import { matchTransactionCategory } from "@/lib/categories";
import type { FileWorkspaceState, TransactionType } from "@/types/transaction";

type MatchedCategory = ReturnType<typeof matchTransactionCategory>;

export type ProcessedTransaction = FileWorkspaceState["transactions"][number] & {
  bank: string;
  statementPeriod: string | null;
  category: MatchedCategory;
};

export type RepeatedTransactionPattern = {
  description: string;
  amount: number;
  type: TransactionType;
  count: number;
  lastDate: string;
  sourceFiles: string[];
};

function normalizeDescription(description: string) {
  return description.toLowerCase().replace(/\s+/g, " ").trim();
}

export function buildProcessedTransactions(
  files: FileWorkspaceState["files"],
  transactions: FileWorkspaceState["transactions"],
  categories: FileWorkspaceState["categories"],
  merchantMappings: FileWorkspaceState["merchantMappings"],
) {
  const processedFileMap = new Map(
    files
      .filter((file) => file.status === "processed")
      .map((file) => [file.name, file]),
  );

  return transactions
    .filter((transaction) => processedFileMap.has(transaction.sourceFile))
    .map((transaction) => {
      const file = processedFileMap.get(transaction.sourceFile)!;

      return {
        ...transaction,
        bank: file.bank,
        statementPeriod: file.statementPeriod,
        category: matchTransactionCategory(
          transaction,
          categories,
          merchantMappings,
        ),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function buildRepeatedTransactionPatterns(
  transactions: ProcessedTransaction[],
) {
  const map = new Map<
    string,
    {
      description: string;
      amount: number;
      type: TransactionType;
      count: number;
      lastDate: string;
      files: Set<string>;
    }
  >();

  for (const transaction of transactions) {
    const key = `${transaction.type}|${transaction.amount}|${normalizeDescription(transaction.description)}`;
    const current = map.get(key) ?? {
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      count: 0,
      lastDate: transaction.date,
      files: new Set<string>(),
    };

    current.count += 1;

    if (transaction.date > current.lastDate) {
      current.lastDate = transaction.date;
    }

    current.files.add(transaction.sourceFile);
    map.set(key, current);
  }

  return [...map.values()]
    .filter((item) => item.count >= 3)
    .map((item) => ({
      description: item.description,
      amount: item.amount,
      type: item.type,
      count: item.count,
      lastDate: item.lastDate,
      sourceFiles: [...item.files].sort(),
    }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, 12);
}
