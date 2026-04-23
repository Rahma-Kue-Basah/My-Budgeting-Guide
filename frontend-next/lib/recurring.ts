import { matchTransactionCategory } from "@/lib/categories";
import { resolveTransactionMerchant } from "@/lib/merchants";
import type {
  CategoryColor,
  FileWorkspaceState,
  TransactionType,
} from "@/types/transaction";

export type RecurringCadence = "weekly" | "biweekly" | "monthly" | "quarterly";
export type RecurringConfidence = "high" | "medium" | "low";
export type RecurringAmountStability = "fixed" | "slight" | "variable";

type ProcessedRecurringTransaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  sourceFile: string;
  bank: string;
  merchantKey: string;
  merchantName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
};

export type RecurringPatternOccurrence = {
  id: string;
  date: string;
  description: string;
  amount: number;
  sourceFile: string;
  bank: string;
  intervalFromPrevious: number | null;
};

export type DetectedRecurringPattern = {
  id: string;
  merchantKey: string;
  merchantName: string;
  type: TransactionType;
  cadence: RecurringCadence;
  cadenceLabel: string;
  confidence: RecurringConfidence;
  confidenceLabel: string;
  confidenceScore: number;
  matchRate: number;
  amountStability: RecurringAmountStability;
  amountStabilityLabel: string;
  typicalAmount: number;
  minAmount: number;
  maxAmount: number;
  count: number;
  averageIntervalDays: number;
  lastSeen: string;
  nextExpected: string;
  daysUntilNext: number;
  monthlyEstimate: number;
  descriptionSample: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
  banks: string[];
  sourceFiles: string[];
  transactions: RecurringPatternOccurrence[];
};

type CadenceConfig = {
  cadence: RecurringCadence;
  label: string;
  targetDays: number;
  toleranceDays: number;
  monthlyFactor: number;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const CADENCE_CONFIGS: CadenceConfig[] = [
  {
    cadence: "weekly",
    label: "Mingguan",
    targetDays: 7,
    toleranceDays: 2,
    monthlyFactor: 52 / 12,
  },
  {
    cadence: "biweekly",
    label: "2 Mingguan",
    targetDays: 14,
    toleranceDays: 4,
    monthlyFactor: 26 / 12,
  },
  {
    cadence: "monthly",
    label: "Bulanan",
    targetDays: 30.5,
    toleranceDays: 7,
    monthlyFactor: 1,
  },
  {
    cadence: "quarterly",
    label: "Kuartalan",
    targetDays: 91,
    toleranceDays: 14,
    monthlyFactor: 1 / 3,
  },
];

export const RECURRING_CONFIDENCE_LABELS: Record<RecurringConfidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export const RECURRING_AMOUNT_STABILITY_LABELS: Record<
  RecurringAmountStability,
  string
> = {
  fixed: "Fixed amount",
  slight: "Slightly varying",
  variable: "Variable amount",
};

function startOfDay(value: string | Date) {
  const date = new Date(value);

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysBetween(start: string, end: string) {
  const diff = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.max(1, Math.round(diff / DAY_IN_MS));
}

function daysFromToday(value: string) {
  const diff = startOfDay(value).getTime() - startOfDay(new Date()).getTime();
  return Math.round(diff / DAY_IN_MS);
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], average: number) {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function getAmountTolerance(amount: number) {
  if (amount < 100_000) {
    return 10_000;
  }

  if (amount < 500_000) {
    return 25_000;
  }

  if (amount < 2_000_000) {
    return 75_000;
  }

  return Math.max(100_000, amount * 0.08);
}

function getConfidence(value: number): RecurringConfidence {
  if (value >= 0.8) {
    return "high";
  }

  if (value >= 0.65) {
    return "medium";
  }

  return "low";
}

function getAmountStability(
  minAmount: number,
  maxAmount: number,
  averageAmount: number,
): RecurringAmountStability {
  if (averageAmount <= 0) {
    return "fixed";
  }

  const range = maxAmount - minAmount;
  const ratio = range / averageAmount;

  if (range <= 10_000 || ratio <= 0.03) {
    return "fixed";
  }

  if (range <= 50_000 || ratio <= 0.12) {
    return "slight";
  }

  return "variable";
}

function pickMostCommonValue<T extends string | null>(values: T[]) {
  if (values.length === 0) {
    return null;
  }

  const counts = new Map<T, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function pickMostCommonDescription(transactions: ProcessedRecurringTransaction[]) {
  const counts = new Map<string, number>();

  for (const transaction of transactions) {
    counts.set(
      transaction.description,
      (counts.get(transaction.description) ?? 0) + 1,
    );
  }

  return (
    [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
    transactions[0]?.description ??
    "-"
  );
}

function buildProcessedTransactions(
  state: FileWorkspaceState,
): ProcessedRecurringTransaction[] {
  const processedFileMap = new Map(
    state.files
      .filter((file) => file.status === "processed")
      .map((file) => [file.name, file]),
  );

  return state.transactions
    .filter((transaction) => processedFileMap.has(transaction.sourceFile))
    .map((transaction) => {
      const sourceFile = processedFileMap.get(transaction.sourceFile)!;
      const merchant = resolveTransactionMerchant(
        transaction,
        state.merchantMappings,
      );
      const category = matchTransactionCategory(
        transaction,
        state.categories,
        state.merchantMappings,
      );

      return {
        ...transaction,
        bank: sourceFile.bank,
        merchantKey: merchant.merchantKey,
        merchantName: merchant.merchantName,
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? null,
        categoryColor: category?.color ?? null,
      };
    })
    .filter((transaction) => transaction.merchantKey !== "unknown merchant")
    .sort((a, b) => a.date.localeCompare(b.date));
}

function clusterTransactionsByAmount(
  transactions: ProcessedRecurringTransaction[],
) {
  const sorted = [...transactions].sort(
    (a, b) => a.amount - b.amount || a.date.localeCompare(b.date),
  );
  const clusters: ProcessedRecurringTransaction[][] = [];

  for (const transaction of sorted) {
    let bestClusterIndex = -1;
    let smallestDistance = Number.POSITIVE_INFINITY;

    for (const [index, cluster] of clusters.entries()) {
      const center = median(cluster.map((item) => item.amount));
      const distance = Math.abs(transaction.amount - center);

      if (distance <= getAmountTolerance(center) && distance < smallestDistance) {
        bestClusterIndex = index;
        smallestDistance = distance;
      }
    }

    if (bestClusterIndex === -1) {
      clusters.push([transaction]);
      continue;
    }

    clusters[bestClusterIndex].push(transaction);
  }

  return clusters
    .map((cluster) => [...cluster].sort((a, b) => a.date.localeCompare(b.date)))
    .filter((cluster) => cluster.length >= 3);
}

function analyzeCluster(
  transactions: ProcessedRecurringTransaction[],
): DetectedRecurringPattern | null {
  if (transactions.length < 3) {
    return null;
  }

  const intervals = transactions.slice(1).map((transaction, index) =>
    daysBetween(transactions[index].date, transaction.date),
  );

  if (intervals.length < 2) {
    return null;
  }

  const amounts = transactions.map((transaction) => transaction.amount);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const typicalAmount = Math.round(median(amounts));
  const averageAmount = mean(amounts);
  const amountStdDev = standardDeviation(amounts, averageAmount);
  const amountCoefficient = averageAmount > 0 ? amountStdDev / averageAmount : 0;
  const amountScore = 1 - Math.min(amountCoefficient / 0.18, 1);

  let bestCandidate: {
    config: CadenceConfig;
    confidenceScore: number;
    averageIntervalDays: number;
    matchRate: number;
  } | null = null;

  for (const config of CADENCE_CONFIGS) {
    const compatibleIntervals = intervals.flatMap((interval) => {
      const multiple = Math.max(
        1,
        Math.min(3, Math.round(interval / config.targetDays)),
      );
      const expected = config.targetDays * multiple;
      const tolerance = config.toleranceDays * multiple;

      if (Math.abs(interval - expected) > tolerance) {
        return [];
      }

      return [interval / multiple];
    });

    if (compatibleIntervals.length < 2) {
      continue;
    }

    const matchRate = compatibleIntervals.length / intervals.length;

    if (matchRate < 0.67) {
      continue;
    }

    const averageIntervalDays = mean(compatibleIntervals);
    const intervalDeviation = mean(
      compatibleIntervals.map((value) => Math.abs(value - config.targetDays)),
    );
    const intervalScore =
      1 - Math.min(intervalDeviation / config.toleranceDays, 1);
    const countScore = Math.min(transactions.length / 6, 1);
    const spanScore = Math.min(
      daysBetween(transactions[0].date, transactions.at(-1)!.date) /
        (config.targetDays * 2),
      1,
    );

    const confidenceScore =
      matchRate * 0.45 +
      intervalScore * 0.2 +
      amountScore * 0.15 +
      countScore * 0.1 +
      spanScore * 0.1;

    if (
      !bestCandidate ||
      confidenceScore > bestCandidate.confidenceScore ||
      (confidenceScore === bestCandidate.confidenceScore &&
        matchRate > bestCandidate.matchRate)
    ) {
      bestCandidate = {
        config,
        confidenceScore,
        averageIntervalDays,
        matchRate,
      };
    }
  }

  if (!bestCandidate || bestCandidate.confidenceScore < 0.58) {
    return null;
  }

  const nextExpected = addDays(
    transactions.at(-1)!.date,
    Math.max(1, Math.round(bestCandidate.averageIntervalDays)),
  );
  const confidence = getConfidence(bestCandidate.confidenceScore);
  const amountStability = getAmountStability(
    minAmount,
    maxAmount,
    averageAmount,
  );
  const categoryId = pickMostCommonValue(
    transactions.map((transaction) => transaction.categoryId),
  );
  const categorySource = transactions.find(
    (transaction) => transaction.categoryId === categoryId,
  );
  const descriptionSample = pickMostCommonDescription(transactions);

  return {
    id: [
      transactions[0].merchantKey,
      transactions[0].type,
      bestCandidate.config.cadence,
      typicalAmount,
      transactions.length,
    ].join("|"),
    merchantKey: transactions[0].merchantKey,
    merchantName: transactions[0].merchantName,
    type: transactions[0].type,
    cadence: bestCandidate.config.cadence,
    cadenceLabel: bestCandidate.config.label,
    confidence,
    confidenceLabel: RECURRING_CONFIDENCE_LABELS[confidence],
    confidenceScore: bestCandidate.confidenceScore,
    matchRate: bestCandidate.matchRate,
    amountStability,
    amountStabilityLabel: RECURRING_AMOUNT_STABILITY_LABELS[amountStability],
    typicalAmount,
    minAmount,
    maxAmount,
    count: transactions.length,
    averageIntervalDays: bestCandidate.averageIntervalDays,
    lastSeen: transactions.at(-1)!.date,
    nextExpected,
    daysUntilNext: daysFromToday(nextExpected),
    monthlyEstimate: typicalAmount * bestCandidate.config.monthlyFactor,
    descriptionSample,
    categoryId,
    categoryName: categorySource?.categoryName ?? null,
    categoryColor: categorySource?.categoryColor ?? null,
    banks: [...new Set(transactions.map((transaction) => transaction.bank))],
    sourceFiles: [...new Set(transactions.map((transaction) => transaction.sourceFile))],
    transactions: transactions.map((transaction, index) => ({
      id: transaction.id,
      date: transaction.date,
      description: transaction.description,
      amount: transaction.amount,
      sourceFile: transaction.sourceFile,
      bank: transaction.bank,
      intervalFromPrevious:
        index === 0 ? null : daysBetween(transactions[index - 1].date, transaction.date),
    })),
  };
}

export function detectRecurringPatterns(state: FileWorkspaceState) {
  const processedTransactions = buildProcessedTransactions(state);
  const groupedByMerchant = new Map<string, ProcessedRecurringTransaction[]>();

  for (const transaction of processedTransactions) {
    const key = `${transaction.type}|${transaction.merchantKey}`;
    const current = groupedByMerchant.get(key) ?? [];
    current.push(transaction);
    groupedByMerchant.set(key, current);
  }

  const patterns: DetectedRecurringPattern[] = [];

  for (const transactions of groupedByMerchant.values()) {
    if (transactions.length < 3) {
      continue;
    }

    for (const cluster of clusterTransactionsByAmount(transactions)) {
      const pattern = analyzeCluster(cluster);

      if (pattern) {
        patterns.push(pattern);
      }
    }
  }

  return patterns.sort((a, b) => {
    if (b.confidenceScore !== a.confidenceScore) {
      return b.confidenceScore - a.confidenceScore;
    }

    if (b.monthlyEstimate !== a.monthlyEstimate) {
      return b.monthlyEstimate - a.monthlyEstimate;
    }

    return b.count - a.count;
  });
}
