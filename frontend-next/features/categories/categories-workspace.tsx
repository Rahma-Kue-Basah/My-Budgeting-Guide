"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { SummaryCard } from "@/components/ui/summary-card";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  getCategoryChartColor,
} from "@/lib/charts";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import type { CategoryColor } from "@/types/transaction";

type CategoryAggregateRow = {
  id: string;
  name: string;
  color: CategoryColor | null;
  transactionCount: number;
  income: number;
  expense: number;
  total: number;
};

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

export function CategoriesWorkspace() {
  const { state, isHydrated } = useFileWorkspace();

  const categoryRows = useMemo<CategoryAggregateRow[]>(() => {
    const baseRows = state.categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      transactionCount: 0,
      income: 0,
      expense: 0,
      total: 0,
    }));

    const uncategorizedRow: CategoryAggregateRow = {
      id: "uncategorized",
      name: "Uncategorized",
      color: null,
      transactionCount: 0,
      income: 0,
      expense: 0,
      total: 0,
    };

    const rowMap = new Map<string, CategoryAggregateRow>(
      baseRows.map((row) => [row.id, row]),
    );
    rowMap.set(uncategorizedRow.id, uncategorizedRow);

    for (const transaction of state.transactions) {
      const matched = matchTransactionCategory(
        transaction,
        state.categories,
        state.merchantMappings,
      );
      const row = rowMap.get(matched?.id ?? "uncategorized");

      if (!row) {
        continue;
      }

      row.transactionCount += 1;
      if (transaction.type === "credit") {
        row.income += transaction.amount;
      } else {
        row.expense += transaction.amount;
      }
      row.total += transaction.amount;
    }

    return [...rowMap.values()]
      .filter((row) => row.transactionCount > 0)
      .sort((a, b) => b.expense - a.expense || b.transactionCount - a.transactionCount);
  }, [state.categories, state.merchantMappings, state.transactions]);

  const summary = useMemo(() => {
    const uncategorized = categoryRows.find((row) => row.id === "uncategorized");
    const categorizedRows = categoryRows.filter((row) => row.id !== "uncategorized");
    const totalTransactions = categoryRows.reduce(
      (sum, row) => sum + row.transactionCount,
      0,
    );

    return {
      totalCategories: categorizedRows.length,
      totalTransactions,
      uncategorizedCount: uncategorized?.transactionCount ?? 0,
      uncategorizedExpense: uncategorized?.expense ?? 0,
    };
  }, [categoryRows]);

  const chartData = useMemo(
    () =>
      categoryRows
        .filter((row) => row.expense > 0)
        .slice(0, 8)
        .map((row) => ({
          name: row.name,
          amount: row.expense,
          fill: row.color ? getCategoryChartColor(row.color) : "var(--text-tertiary)",
        })),
    [categoryRows],
  );

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <section className="sticky top-[58px] z-10 border-b border-subtle bg-surface md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-primary">
            Categories
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              className="h-9 rounded-[9px] border border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              render={<Link href="/rules" />}
            >
              Rules
            </Button>
            <Button
              className="h-9 rounded-[9px] border border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              render={<Link href="/analytics" />}
            >
              Analytics
            </Button>
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Active categories"
            value={summary.totalCategories}
            description="Jumlah kategori yang saat ini benar-benar terpakai oleh transaksi di workspace."
            icon="tag"
          />
          <SummaryCard
            title="Categorized transactions"
            value={summary.totalTransactions - summary.uncategorizedCount}
            description="Jumlah transaksi yang sudah berhasil masuk ke salah satu kategori."
            icon="pie"
          />
          <SummaryCard
            title="Uncategorized"
            value={summary.uncategorizedCount}
            description="Jumlah transaksi yang belum masuk ke kategori mana pun."
            icon="alert"
          />
          <SummaryCard
            title="Uncategorized expense"
            value={formatCurrency(summary.uncategorizedExpense)}
            description="Total pengeluaran yang masih belum masuk kategori dan perlu dibenahi di rules."
            icon="receipt"
          />
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-primary">
                  Category table
                </h2>
                <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                  Ringkasan seluruh kategori berdasarkan jumlah transaksi, income,
                  expense, dan total nominal di workspace.
                </p>
              </div>
              <span className="inline-flex h-5 items-center justify-center rounded-full border border-subtle bg-surface-muted px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-secondary">
                {isHydrated ? `${categoryRows.length} rows` : "Loading"}
              </span>
            </div>

            <CupertinoTable
              columnsClassName="grid-cols-[minmax(0,1.2fr)_90px_130px_130px_130px]"
              minWidthClassName="min-w-[860px]"
              headers={[
                { key: "category", label: "Category" },
                { key: "transactions", label: "Transactions" },
                { key: "income", label: "Income" },
                { key: "expense", label: "Expense" },
                { key: "total", label: "Total" },
              ]}
              hasRows={isHydrated && categoryRows.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                  {!isHydrated
                    ? "Memuat kategori workspace..."
                    : "Belum ada transaksi yang bisa diringkas per kategori."}
                </div>
              }
            >
              {categoryRows.map((row) => (
                <div
                  key={row.id}
                  className={`grid grid-cols-[minmax(0,1.2fr)_90px_130px_130px_130px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                >
                  <div className="min-w-0">
                    <CategoryChip label={row.name} color={row.color} />
                  </div>
                  <span className="text-sm font-semibold text-primary">
                    {row.transactionCount}
                  </span>
                  <span className="text-sm text-success">
                    {row.income > 0 ? formatCurrency(row.income) : "-"}
                  </span>
                  <span className="text-sm text-danger">
                    {row.expense > 0 ? formatCurrency(row.expense) : "-"}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(row.total)}
                  </span>
                </div>
              ))}
            </CupertinoTable>
          </section>

          <section className="rounded-[13px] border-0 bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Category expense chart
              </h2>
              <p className="text-[11px] leading-5 text-tertiary">
                Distribusi expense per kategori untuk membantu melihat kategori yang paling dominan.
              </p>
            </div>

            <div className="mt-4 h-[360px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-[12px] bg-surface-muted text-sm text-tertiary">
                  Belum ada data expense per kategori.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                  >
                    <CartesianGrid
                      horizontal={false}
                      stroke={CHART_GRID_STROKE}
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={CHART_AXIS_TICK}
                      tickFormatter={(value) => formatCompactNumber(Number(value))}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={88}
                      axisLine={false}
                      tickLine={false}
                      tick={CHART_AXIS_TICK}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(0,0,0,0.03)" }}
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(value) =>
                        typeof value === "number" ? formatCurrency(value) : "-"
                      }
                    />
                    <Bar dataKey="amount" radius={[0, 8, 8, 0]} barSize={22}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
