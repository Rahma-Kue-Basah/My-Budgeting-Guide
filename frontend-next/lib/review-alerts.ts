import type { ProcessedTransaction } from "@/lib/transaction-review";

export type AmountAnomalyStats = {
  mean: number;
  stdDev: number;
  iqrUpper: number;
  zScoreThreshold: number;
};

export type AmountDistributionBucket = {
  rangeLabel: string;
  rangeStart: number;
  rangeEnd: number;
  count: number;
};

function percentile(values: number[], p: number) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) {
    return sorted[lower];
  }

  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export function mean(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[], average: number) {
  if (values.length === 0) {
    return 0;
  }

  const variance =
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    values.length;

  return Math.sqrt(variance);
}

export function buildAmountAnomalyStats(
  transactions: ProcessedTransaction[],
): AmountAnomalyStats {
  const values = transactions.map((transaction) => transaction.amount);

  if (values.length === 0) {
    return {
      mean: 0,
      stdDev: 0,
      iqrUpper: 0,
      zScoreThreshold: 0,
    };
  }

  const average = mean(values);
  const stdDev = standardDeviation(values, average);
  const q1 = percentile(values, 0.25);
  const q3 = percentile(values, 0.75);
  const iqr = q3 - q1;

  return {
    mean: average,
    stdDev,
    iqrUpper: q3 + 1.5 * iqr,
    zScoreThreshold: average + 2 * stdDev,
  };
}

export function buildAmountDistributionChart(
  transactions: ProcessedTransaction[],
): AmountDistributionBucket[] {
  const values = transactions
    .map((transaction) => transaction.amount)
    .filter((value) => value > 0);

  if (values.length === 0) {
    return [];
  }

  const maxAmount = Math.max(...values);
  const targetBucketCount = Math.min(12, Math.max(6, Math.round(Math.sqrt(values.length))));
  const rawStep = Math.max(1, maxAmount / targetBucketCount);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalizedStep = rawStep / magnitude;

  let niceStep = magnitude;

  if (normalizedStep <= 1) {
    niceStep = magnitude;
  } else if (normalizedStep <= 2) {
    niceStep = 2 * magnitude;
  } else if (normalizedStep <= 5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  const bucketCount = Math.max(1, Math.ceil(maxAmount / niceStep));
  const buckets = Array.from({ length: bucketCount }, (_, index) => ({
    rangeStart: index * niceStep,
    rangeEnd: (index + 1) * niceStep,
    count: 0,
  }));

  for (const amount of values) {
    const bucketIndex = Math.min(
      buckets.length - 1,
      Math.floor(amount / niceStep),
    );

    buckets[bucketIndex].count += 1;
  }

  return buckets.map((bucket) => ({
    rangeLabel: `${new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(bucket.rangeStart)} - ${new Intl.NumberFormat("id-ID", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(bucket.rangeEnd)}`,
    rangeStart: bucket.rangeStart,
    rangeEnd: bucket.rangeEnd,
    count: bucket.count,
  }));
}
