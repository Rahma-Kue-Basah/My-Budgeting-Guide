import type { ProcessedTransaction } from "@/lib/transaction-review";
import type { WorkspaceCategory } from "@/types/transaction";

export type MonthlyBudgetSummary = {
  month: string;
  salaryIncome: number;
  expense: number;
  net: number;
  transactionCount: number;
};

export type BudgetCategorySuggestion = {
  categoryId: string;
  categoryName: string;
  color: WorkspaceCategory["color"];
  averageExpense: number;
  lastMonthExpense: number;
  recommendedAmount: number;
  coverageMonths: number;
};

export type BudgetSuggestion = {
  historyMonths: string[];
  monthlySummaries: MonthlyBudgetSummary[];
  selectedMonthSummary: MonthlyBudgetSummary | null;
  baselineSalary: number;
  baselineExpense: number;
  baselineSavings: number;
  savingsRate: number;
  categorySuggestions: BudgetCategorySuggestion[];
  uncategorizedAverageExpense: number;
};

const SALARY_CATEGORY_ID = "salary";

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getCurrentMonthValue(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function buildMonthlyBudgetSummaries(
  transactions: ProcessedTransaction[],
) {
  const map = new Map<string, MonthlyBudgetSummary>();

  for (const transaction of transactions) {
    const month = transaction.date.slice(0, 7);
    const current = map.get(month) ?? {
      month,
      salaryIncome: 0,
      expense: 0,
      net: 0,
      transactionCount: 0,
    };

    if (
      transaction.type === "credit" &&
      transaction.category?.id === SALARY_CATEGORY_ID
    ) {
      current.salaryIncome += transaction.amount;
    }

    if (transaction.type === "debit") {
      current.expense += transaction.amount;
    }

    current.transactionCount += 1;
    current.net = current.salaryIncome - current.expense;
    map.set(month, current);
  }

  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export function buildBudgetSuggestion(
  transactions: ProcessedTransaction[],
  selectedMonth: string,
  lookbackMonths: number,
): BudgetSuggestion {
  const monthlySummaries = buildMonthlyBudgetSummaries(transactions);
  const summaryMap = new Map(monthlySummaries.map((item) => [item.month, item]));
  const availableMonths = monthlySummaries.map((item) => item.month);
  const priorMonths = availableMonths.filter((month) => month < selectedMonth);
  const fallbackMonths = availableMonths.filter((month) => month !== selectedMonth);
  const historyMonths =
    (priorMonths.length > 0 ? priorMonths : fallbackMonths).slice(0, lookbackMonths);
  const monthsForAverage =
    historyMonths.length > 0
      ? historyMonths
      : availableMonths.slice(0, Math.max(lookbackMonths, 1));
  const monthsForAverageSet = new Set(monthsForAverage);
  const latestReferenceMonth = monthsForAverage[0] ?? null;
  const monthCount = Math.max(monthsForAverage.length, 1);

  const baselineSalary = average(
    monthsForAverage.map((month) => summaryMap.get(month)?.salaryIncome ?? 0),
  );
  const baselineExpense = average(
    monthsForAverage.map((month) => summaryMap.get(month)?.expense ?? 0),
  );
  const baselineSavings = Math.max(baselineSalary - baselineExpense, 0);

  const categoryMap = new Map<
    string,
    {
      categoryName: string;
      color: WorkspaceCategory["color"];
      totalExpense: number;
      lastMonthExpense: number;
      months: Set<string>;
    }
  >();
  let uncategorizedTotal = 0;

  for (const transaction of transactions) {
    if (
      transaction.type !== "debit" ||
      !monthsForAverageSet.has(transaction.date.slice(0, 7))
    ) {
      continue;
    }

    if (!transaction.category) {
      uncategorizedTotal += transaction.amount;
      continue;
    }

    const current = categoryMap.get(transaction.category.id) ?? {
      categoryName: transaction.category.name,
      color: transaction.category.color,
      totalExpense: 0,
      lastMonthExpense: 0,
      months: new Set<string>(),
    };

    current.totalExpense += transaction.amount;
    current.months.add(transaction.date.slice(0, 7));

    if (latestReferenceMonth && transaction.date.startsWith(latestReferenceMonth)) {
      current.lastMonthExpense += transaction.amount;
    }

    categoryMap.set(transaction.category.id, current);
  }

  const categorySuggestions = [...categoryMap.entries()]
    .map(([categoryId, value]) => ({
      categoryId,
      categoryName: value.categoryName,
      color: value.color,
      averageExpense: Math.round(value.totalExpense / monthCount),
      lastMonthExpense: value.lastMonthExpense,
      recommendedAmount: Math.round(value.totalExpense / monthCount),
      coverageMonths: value.months.size,
    }))
    .filter((item) => item.recommendedAmount > 0)
    .sort(
      (a, b) =>
        b.recommendedAmount - a.recommendedAmount ||
        a.categoryName.localeCompare(b.categoryName),
    );

  return {
    historyMonths: monthsForAverage,
    monthlySummaries,
    selectedMonthSummary: summaryMap.get(selectedMonth) ?? null,
    baselineSalary,
    baselineExpense,
    baselineSavings,
    savingsRate:
      baselineSalary > 0 ? Math.round((baselineSavings / baselineSalary) * 100) : 0,
    categorySuggestions,
    uncategorizedAverageExpense: Math.round(uncategorizedTotal / monthCount),
  };
}
