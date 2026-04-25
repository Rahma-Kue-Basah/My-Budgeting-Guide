"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { Input } from "@/components/ui/input";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  getCategoryChartColor,
} from "@/lib/charts";
import { formatCompactNumber, formatCurrency, formatMonthLabel } from "@/lib/formatters";
import { extractMerchantKey, extractMerchantName } from "@/lib/merchants";
import type { CategoryColor, ParsedTransaction, TransactionType } from "@/types/transaction";

type AnalyticsEntry = {
  transaction: ParsedTransaction;
  source: string;
  category: {
    id: string;
    name: string;
    color: CategoryColor;
  } | null;
  merchantKey: string;
  merchantName: string;
};

type CategoryRow = {
  id: string;
  name: string;
  color: CategoryColor | null;
  transactionCount: number;
  income: number;
  expense: number;
  totalFlow: number;
  topMerchants: string[];
};

type SourceRow = {
  source: string;
  transactionCount: number;
  income: number;
  expense: number;
  net: number;
};

type MerchantRow = {
  merchantKey: string;
  merchantName: string;
  transactionCount: number;
  debitTotal: number;
  creditTotal: number;
  topCategory: string | null;
};

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: "wallet" | "pie" | "users" | "barChart";
}) {
  return (
    <div className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.02em] text-[#8e8e93]">
            {title}
          </p>
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-[#1c1c1e] dark:text-[#f2f2f7]">
            {value}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#f2f2f4] dark:bg-[#3a3a3c]">
          <CupertinoIcon name={icon} className="size-4 text-[#636366] dark:text-[#8e8e93]" />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#8e8e93]">{description}</p>
    </div>
  );
}

function CategoryChip({
  label,
  color,
}: {
  label: string;
  color: CategoryColor | null;
}) {
  if (!color) {
    return <CupertinoChip tone="neutral">{label}</CupertinoChip>;
  }

  return <CupertinoChip tone={color}>{label}</CupertinoChip>;
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] dark:bg-[#2c2c2e] px-4 text-center text-sm text-[#8e8e93]">
      {message}
    </div>
  );
}

function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8e8e93]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function CategoryInsightsWorkspace() {
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");

  const fileMap = useMemo(
    () => new Map(state.files.map((file) => [file.name, file])),
    [state.files],
  );

  const analyticsEntries = useMemo<AnalyticsEntry[]>(
    () =>
      [...state.transactions]
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((transaction) => {
          const matched = matchTransactionCategory(
            transaction,
            state.categories,
            state.merchantMappings,
          );

          return {
            transaction,
            source: fileMap.get(transaction.sourceFile)?.bank ?? "Manual",
            category: matched
              ? {
                  id: matched.id,
                  name: matched.name,
                  color: matched.color,
                }
              : null,
            merchantKey: extractMerchantKey(transaction.description),
            merchantName: extractMerchantName(transaction.description),
          };
        }),
    [fileMap, state.categories, state.merchantMappings, state.transactions],
  );

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return analyticsEntries.filter(({ transaction, source, category, merchantName }) => {
      const matchesSearch =
        !query ||
        `${transaction.description} ${source} ${category?.name ?? ""} ${merchantName}`
          .toLowerCase()
          .includes(query);

      const matchesType = typeFilter === "all" || transaction.type === typeFilter;
      const matchesSource = bankFilter === "all" || source === bankFilter;
      const matchesMonthFrom = !monthFrom || transaction.date.slice(0, 7) >= monthFrom;
      const matchesMonthTo = !monthTo || transaction.date.slice(0, 7) <= monthTo;

      return (
        matchesSearch &&
        matchesType &&
        matchesSource &&
        matchesMonthFrom &&
        matchesMonthTo
      );
    });
  }, [analyticsEntries, bankFilter, monthFrom, monthTo, search, typeFilter]);

  const sourceOptions = useMemo(
    () => [
      { value: "all", label: "Semua source" },
      ...[...new Set(analyticsEntries.map((item) => item.source))]
        .sort((a, b) => a.localeCompare(b))
        .map((source) => ({ value: source, label: source })),
    ],
    [analyticsEntries],
  );

  const typeOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  const summary = useMemo(() => {
    const totalTransactions = filteredEntries.length;
    const categorizedCount = filteredEntries.filter((item) => item.category).length;
    const activeSources = new Set(filteredEntries.map((item) => item.source)).size;

    let income = 0;
    let expense = 0;

    for (const item of filteredEntries) {
      if (item.transaction.type === "credit") {
        income += item.transaction.amount;
      } else {
        expense += item.transaction.amount;
      }
    }

    return {
      totalTransactions,
      categorizedCount,
      coverage:
        totalTransactions > 0
          ? Math.round((categorizedCount / totalTransactions) * 100)
          : 0,
      activeSources,
      income,
      expense,
      net: income - expense,
    };
  }, [filteredEntries]);

  const categoryRows = useMemo<CategoryRow[]>(() => {
    const categoryMap = new Map<string, CategoryRow>();

    for (const item of filteredEntries) {
      const key = item.category?.id ?? "uncategorized";
      const current = categoryMap.get(key) ?? {
        id: key,
        name: item.category?.name ?? "Uncategorized",
        color: item.category?.color ?? null,
        transactionCount: 0,
        income: 0,
        expense: 0,
        totalFlow: 0,
        topMerchants: [],
      };

      current.transactionCount += 1;
      if (item.transaction.type === "credit") {
        current.income += item.transaction.amount;
      } else {
        current.expense += item.transaction.amount;
      }
      current.totalFlow += item.transaction.amount;

      categoryMap.set(key, current);
    }

    const merchantMapByCategory = new Map<string, Map<string, number>>();

    for (const item of filteredEntries) {
      const categoryKey = item.category?.id ?? "uncategorized";
      const merchantMap = merchantMapByCategory.get(categoryKey) ?? new Map<string, number>();
      merchantMap.set(
        item.merchantName,
        (merchantMap.get(item.merchantName) ?? 0) + 1,
      );
      merchantMapByCategory.set(categoryKey, merchantMap);
    }

    return [...categoryMap.values()]
      .map((row) => {
        const merchantMap = merchantMapByCategory.get(row.id) ?? new Map<string, number>();
        const topMerchants = [...merchantMap.entries()]
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
          .slice(0, 3)
          .map(([name]) => name);

        return {
          ...row,
          topMerchants,
        };
      })
      .sort((a, b) => b.expense - a.expense || b.transactionCount - a.transactionCount);
  }, [filteredEntries]);

  const sourceRows = useMemo<SourceRow[]>(() => {
    const map = new Map<string, SourceRow>();

    for (const item of filteredEntries) {
      const current = map.get(item.source) ?? {
        source: item.source,
        transactionCount: 0,
        income: 0,
        expense: 0,
        net: 0,
      };

      current.transactionCount += 1;
      if (item.transaction.type === "credit") {
        current.income += item.transaction.amount;
      } else {
        current.expense += item.transaction.amount;
      }
      current.net = current.income - current.expense;
      map.set(item.source, current);
    }

    return [...map.values()].sort(
      (a, b) => b.transactionCount - a.transactionCount || b.expense - a.expense,
    );
  }, [filteredEntries]);

  const merchantRows = useMemo<MerchantRow[]>(() => {
    const map = new Map<string, MerchantRow>();
    const categoryCountByMerchant = new Map<string, Map<string, number>>();

    for (const item of filteredEntries) {
      const current = map.get(item.merchantKey) ?? {
        merchantKey: item.merchantKey,
        merchantName: item.merchantName,
        transactionCount: 0,
        debitTotal: 0,
        creditTotal: 0,
        topCategory: null,
      };

      current.transactionCount += 1;
      if (item.transaction.type === "credit") {
        current.creditTotal += item.transaction.amount;
      } else {
        current.debitTotal += item.transaction.amount;
      }
      map.set(item.merchantKey, current);

      const categoryMap = categoryCountByMerchant.get(item.merchantKey) ?? new Map<string, number>();
      const categoryName = item.category?.name ?? "Uncategorized";
      categoryMap.set(categoryName, (categoryMap.get(categoryName) ?? 0) + 1);
      categoryCountByMerchant.set(item.merchantKey, categoryMap);
    }

    return [...map.values()]
      .map((row) => {
        const categoryMap = categoryCountByMerchant.get(row.merchantKey) ?? new Map<string, number>();
        const topCategory =
          [...categoryMap.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
          null;

        return {
          ...row,
          topCategory,
        };
      })
      .sort((a, b) => b.debitTotal - a.debitTotal || b.transactionCount - a.transactionCount)
      .slice(0, 10);
  }, [filteredEntries]);

  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; net: number }>();

    for (const item of filteredEntries) {
      const month = item.transaction.date.slice(0, 7);
      const current = map.get(month) ?? {
        month,
        income: 0,
        expense: 0,
        net: 0,
      };

      if (item.transaction.type === "credit") {
        current.income += item.transaction.amount;
      } else {
        current.expense += item.transaction.amount;
      }
      current.net = current.income - current.expense;
      map.set(month, current);
    }

    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((row) => ({
        ...row,
        monthLabel: formatMonthLabel(row.month),
      }));
  }, [filteredEntries]);

  const expenseChartData = useMemo(
    () =>
      categoryRows
        .filter((row) => row.expense > 0)
        .slice(0, 6)
        .map((row) => ({
          name: row.name,
          total: row.expense,
          fill: row.color ? getCategoryChartColor(row.color) : "#8e8e93",
        })),
    [categoryRows],
  );

  const sourceChartData = useMemo(
    () =>
      sourceRows.slice(0, 6).map((row) => ({
        name: row.source,
        total: row.expense > 0 ? row.expense : row.transactionCount,
        fill: "#0a84ff",
      })),
    [sourceRows],
  );

  const topExpenseCategory = expenseChartData[0];

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setMonthFrom("");
    setMonthTo("");
  }

  const summaryCards = [
    {
      title: "Net flow",
      value: formatCurrency(summary.net),
      description: "Selisih income dan expense dari transaksi yang sedang terfilter.",
      icon: "wallet" as const,
    },
    {
      title: "Coverage",
      value: `${summary.coverage}%`,
      description: "Persentase transaksi yang sudah masuk ke kategori tertentu.",
      icon: "pie" as const,
    },
    {
      title: "Active sources",
      value: summary.activeSources,
      description: "Jumlah source transaksi yang aktif dalam cakupan analisis ini.",
      icon: "users" as const,
    },
    {
      title: "Top expense category",
      value: topExpenseCategory?.name ?? "-",
      description: topExpenseCategory
        ? formatCurrency(topExpenseCategory.total)
        : "Belum ada pengeluaran terkategori",
      icon: "barChart" as const,
    },
  ];

  return (
    <main className="min-h-svh flex-1 bg-[#f2f2f4] dark:bg-black text-[#1c1c1e] dark:text-[#f2f2f7]">
      <section className="sticky top-[58px] z-10 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#f2f2f7]">
            Analytics
          </h1>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="space-y-1">
            <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
              Analytics filters
            </h2>
            <p className="text-[11px] leading-5 text-[#8e8e93]">
              Jelajahi performa kategori, source, merchant, dan cash flow dari seluruh transaksi workspace.
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-[#8e8e93]">Search</span>
              <div className="relative">
                <CupertinoIcon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#8e8e93]"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kategori, merchant, deskripsi, atau source"
                  className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] pl-9 shadow-none focus-visible:ring-[#007aff]/30"
                />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-[#8e8e93]">Type</span>
              <CupertinoSelect
                icon="repeat"
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as "all" | TransactionType)}
                options={typeOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter analytics transaction type"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-[#8e8e93]">Source</span>
              <CupertinoSelect
                icon="wallet"
                value={bankFilter}
                onChange={setBankFilter}
                options={sourceOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter analytics source"
              />
            </label>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="h-10 rounded-[10px] border-black/[0.08] bg-[#f7f7f8] px-3 text-[#1c1c1e] dark:text-[#f2f2f7] shadow-none hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
              >
                Reset filters
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-[#8e8e93]">Month from</span>
              <Input
                type="month"
                value={monthFrom}
                onChange={(event) => setMonthFrom(event.target.value)}
                className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] shadow-none focus-visible:ring-[#007aff]/30"
              />
            </label>
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-[#8e8e93]">Month to</span>
              <Input
                type="month"
                value={monthTo}
                onChange={(event) => setMonthTo(event.target.value)}
                className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] shadow-none focus-visible:ring-[#007aff]/30"
              />
            </label>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <SummaryCard
              key={card.title}
              title={card.title}
              value={card.value}
              description={card.description}
              icon={card.icon}
            />
          ))}
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Cash flow trend</h2>
              <p className="text-[11px] leading-5 text-[#8e8e93]">
                Pergerakan income, expense, dan net flow per bulan untuk melihat momentum workspace.
              </p>
            </div>
            <div className="mt-4">
              <ChartLegend
                items={[
                  { label: "Income", color: "rgb(52 211 153)" },
                  { label: "Expense", color: "rgb(251 113 133)" },
                  { label: "Net", color: "rgb(10 132 255)" },
                ]}
              />
            </div>
            <div className="mt-4">
              {!isHydrated || monthlyTrendData.length === 0 ? (
                <ChartEmptyState message="Belum ada histori bulanan untuk divisualisasikan." />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrendData}
                      margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid
                        stroke={CHART_GRID_STROKE}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="monthLabel"
                        tickLine={false}
                        axisLine={false}
                        tick={CHART_AXIS_TICK}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={64}
                        tick={CHART_AXIS_TICK}
                        tickFormatter={formatCompactNumber}
                      />
                      <RechartsTooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value) =>
                          typeof value === "number" ? formatCurrency(value) : "-"
                        }
                      />
                      <Line type="monotone" dataKey="income" stroke="rgb(52 211 153)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="expense" stroke="rgb(251 113 133)" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="net" stroke="rgb(10 132 255)" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Source pressure</h2>
              <p className="text-[11px] leading-5 text-[#8e8e93]">
                Melihat source yang paling berat mendorong expense atau volume transaksi.
              </p>
            </div>
            <div className="mt-4">
              {!isHydrated || sourceChartData.length === 0 ? (
                <ChartEmptyState message="Belum ada source aktif untuk divisualisasikan." />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sourceChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid
                        stroke={CHART_GRID_STROKE}
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={CHART_AXIS_TICK}
                        tickFormatter={formatCompactNumber}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={88}
                        tick={CHART_AXIS_TICK}
                      />
                      <RechartsTooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value) =>
                          typeof value === "number" ? formatCurrency(value) : "-"
                        }
                      />
                      <Bar dataKey="total" radius={[0, 7, 7, 0]} barSize={24}>
                        {sourceChartData.map((item) => (
                          <Cell key={item.name} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                  Category performance
                </h2>
                <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                  Ringkasan kategori, merchant dominan, dan kontribusi income/expense per kategori.
                </p>
              </div>
              <CupertinoChip tone="neutral">
                {isHydrated ? `${categoryRows.length} categories` : "Loading"}
              </CupertinoChip>
            </div>
            <CupertinoTable
              columnsClassName="grid-cols-[160px_minmax(0,1.3fr)_100px_120px_120px_120px]"
              minWidthClassName="min-w-[1060px]"
              headers={[
                { key: "category", label: "Category" },
                { key: "merchants", label: "Top merchants" },
                { key: "transactions", label: "Transactions" },
                { key: "income", label: "Income" },
                { key: "expense", label: "Expense" },
                { key: "flow", label: "Total flow" },
              ]}
              hasRows={isHydrated && categoryRows.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                  {!isHydrated
                    ? "Memuat analitik workspace..."
                    : "Belum ada data kategori untuk ditampilkan."}
                </div>
              }
            >
              {categoryRows.map((row) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[160px_minmax(0,1.3fr)_100px_120px_120px_120px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                >
                  <div className="min-w-0">
                    <CategoryChip label={row.name} color={row.color} />
                  </div>
                  <div className="flex min-w-0 flex-wrap gap-1.5">
                    {row.topMerchants.length > 0 ? (
                      row.topMerchants.map((merchant) => (
                        <CupertinoChip key={`${row.id}-${merchant}`} tone="neutral">
                          {merchant}
                        </CupertinoChip>
                      ))
                    ) : (
                      <span className="text-[11px] text-[#8e8e93]">-</span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                    {row.transactionCount}
                  </span>
                  <span className="text-[11px] text-[#1f8f43]">
                    {row.income > 0 ? formatCurrency(row.income) : "-"}
                  </span>
                  <span className="text-[11px] text-[#ff453a]">
                    {row.expense > 0 ? formatCurrency(row.expense) : "-"}
                  </span>
                  <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                    {formatCurrency(row.totalFlow)}
                  </span>
                </div>
              ))}
            </CupertinoTable>
          </section>

          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                Expense by category
              </h2>
              <p className="text-[11px] leading-5 text-[#8e8e93]">
                Distribusi pengeluaran per kategori untuk melihat kategori yang paling dominan.
              </p>
            </div>
            <div className="mt-4">
              {!isHydrated || expenseChartData.length === 0 ? (
                <ChartEmptyState message="Belum ada pengeluaran terkategori." />
              ) : (
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={expenseChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid
                        stroke={CHART_GRID_STROKE}
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tickLine={false}
                        axisLine={false}
                        tick={CHART_AXIS_TICK}
                        tickFormatter={formatCompactNumber}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tickLine={false}
                        axisLine={false}
                        tick={CHART_AXIS_TICK}
                      />
                      <RechartsTooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value) =>
                          typeof value === "number" ? formatCurrency(value) : "-"
                        }
                      />
                      <Bar dataKey="total" radius={[0, 7, 7, 0]} barSize={22}>
                        {expenseChartData.map((item) => (
                          <Cell key={item.name} fill={item.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                  Source performance
                </h2>
                <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                  Melihat source mana yang paling aktif dan bagaimana net contribution-nya.
                </p>
              </div>
              <CupertinoChip tone="neutral">
                {isHydrated ? `${sourceRows.length} sources` : "Loading"}
              </CupertinoChip>
            </div>
            <CupertinoTable
              columnsClassName="grid-cols-[minmax(0,1fr)_100px_120px_120px_120px]"
              minWidthClassName="min-w-[760px]"
              headers={[
                { key: "source", label: "Source" },
                { key: "transactions", label: "Transactions" },
                { key: "income", label: "Income" },
                { key: "expense", label: "Expense" },
                { key: "net", label: "Net" },
              ]}
              hasRows={isHydrated && sourceRows.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                  {!isHydrated
                    ? "Memuat source workspace..."
                    : "Belum ada source yang bisa dianalisis."}
                </div>
              }
            >
              {sourceRows.map((row) => (
                <div
                  key={row.source}
                  className={`grid grid-cols-[minmax(0,1fr)_100px_120px_120px_120px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                >
                  <span className="truncate text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">{row.source}</span>
                  <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{row.transactionCount}</span>
                  <span className="text-[11px] text-[#1f8f43]">
                    {row.income > 0 ? formatCurrency(row.income) : "-"}
                  </span>
                  <span className="text-[11px] text-[#ff453a]">
                    {row.expense > 0 ? formatCurrency(row.expense) : "-"}
                  </span>
                  <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                    {formatCurrency(row.net)}
                  </span>
                </div>
              ))}
            </CupertinoTable>
          </section>

          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                  Merchant signals
                </h2>
                <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                  Merchant paling dominan berdasarkan spend, frekuensi, dan kategori teratasnya.
                </p>
              </div>
              <CupertinoChip tone="neutral">
                {isHydrated ? `${merchantRows.length} merchants` : "Loading"}
              </CupertinoChip>
            </div>
            <CupertinoTable
              columnsClassName="grid-cols-[minmax(0,1.2fr)_100px_130px_130px_140px]"
              minWidthClassName="min-w-[860px]"
              headers={[
                { key: "merchant", label: "Merchant" },
                { key: "transactions", label: "Transactions" },
                { key: "debit", label: "Debit total" },
                { key: "credit", label: "Credit total" },
                { key: "category", label: "Top category" },
              ]}
              hasRows={isHydrated && merchantRows.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                  {!isHydrated
                    ? "Memuat merchant signals..."
                    : "Belum ada merchant yang bisa diringkas."}
                </div>
              }
            >
              {merchantRows.map((row) => (
                <div
                  key={row.merchantKey}
                  className={`grid grid-cols-[minmax(0,1.2fr)_100px_130px_130px_140px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                >
                  <span className="truncate text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">{row.merchantName}</span>
                  <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{row.transactionCount}</span>
                  <span className="text-[11px] text-[#ff453a]">
                    {row.debitTotal > 0 ? formatCurrency(row.debitTotal) : "-"}
                  </span>
                  <span className="text-[11px] text-[#1f8f43]">
                    {row.creditTotal > 0 ? formatCurrency(row.creditTotal) : "-"}
                  </span>
                  <span className="truncate text-[11px] text-[#636366] dark:text-[#8e8e93]">
                    {row.topCategory ?? "-"}
                  </span>
                </div>
              ))}
            </CupertinoTable>
          </section>
        </div>
      </div>
    </main>
  );
}
