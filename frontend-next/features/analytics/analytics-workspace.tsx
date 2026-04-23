"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { BarChart3, PieChart, Search, Tags } from "lucide-react";

import { FilterCard } from "@/components/filters/filter-card";
import { FilterDropdown } from "@/components/filters/filter-dropdown";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { CATEGORY_COLOR_STYLES, matchTransactionCategory } from "@/lib/categories";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  getCategoryChartColor,
} from "@/lib/charts";
import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import { extractMerchantKey, extractMerchantName } from "@/lib/merchants";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TransactionType } from "@/types/transaction";

export function CategoryInsightsWorkspace() {
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");

  const processedFileMap = useMemo(
    () =>
      new Map(
        state.files
          .filter((file) => file.status === "processed")
          .map((file) => [file.name, file]),
      ),
    [state.files],
  );

  const categorizedTransactions = useMemo(
    () =>
      state.transactions
        .filter((transaction) => processedFileMap.has(transaction.sourceFile))
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((transaction) => ({
          transaction,
          bank: processedFileMap.get(transaction.sourceFile)?.bank ?? "-",
          category: matchTransactionCategory(
            transaction,
            state.categories,
            state.merchantMappings,
          ),
        })),
    [
      processedFileMap,
      state.categories,
      state.merchantMappings,
      state.transactions,
    ],
  );

  const filteredCategorizedTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return categorizedTransactions.filter(({ transaction, bank, category }) => {
      const matchesSearch =
        !query ||
        `${transaction.description} ${bank} ${category?.name ?? ""} ${extractMerchantName(transaction.description)}`
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;
      const matchesBank = bankFilter === "all" || bank === bankFilter;
      const matchesMonthFrom =
        !monthFrom || transaction.date.slice(0, 7) >= monthFrom;
      const matchesMonthTo =
        !monthTo || transaction.date.slice(0, 7) <= monthTo;

      return (
        matchesSearch &&
        matchesType &&
        matchesBank &&
        matchesMonthFrom &&
        matchesMonthTo
      );
    });
  }, [bankFilter, categorizedTransactions, monthFrom, monthTo, search, typeFilter]);

  const bankFilterOptions = useMemo(
    () => [
      { value: "all", label: "Semua bank" },
      ...[...new Set(categorizedTransactions.map((item) => item.bank))]
        .sort((a, b) => a.localeCompare(b))
        .map((bank) => ({
          value: bank,
          label: bank,
        })),
    ],
    [categorizedTransactions],
  );

  const summary = useMemo(() => {
    const categorizedCount = filteredCategorizedTransactions.filter(
      (item) => item.category,
    ).length;

    return {
      categorizedCount,
      coverage:
        filteredCategorizedTransactions.length > 0
          ? Math.round(
              (categorizedCount / filteredCategorizedTransactions.length) * 100,
            )
          : 0,
    };
  }, [filteredCategorizedTransactions]);

  const categoryRows = useMemo(() => {
    const rows = state.categories.map((category) => {
      const matched = filteredCategorizedTransactions.filter(
        (item) => item.category?.id === category.id,
      );

      const income = matched.reduce(
        (sum, item) =>
          item.transaction.type === "credit"
            ? sum + item.transaction.amount
            : sum,
        0,
      );

      const expense = matched.reduce(
        (sum, item) =>
          item.transaction.type === "debit"
            ? sum + item.transaction.amount
            : sum,
        0,
      );

      const merchantMap = new Map<
        string,
        {
          name: string;
          count: number;
        }
      >();

      for (const item of matched) {
        const merchantKey = extractMerchantKey(item.transaction.description);
        const current = merchantMap.get(merchantKey) ?? {
          name: extractMerchantName(item.transaction.description),
          count: 0,
        };

        current.count += 1;
        merchantMap.set(merchantKey, current);
      }

      const topMerchants = [...merchantMap.values()]
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .slice(0, 3);

      return {
        id: category.id,
        name: category.name,
        color: category.color,
        transactionCount: matched.length,
        income,
        expense,
        total: income + expense,
        topMerchants,
      };
    });

    return rows
      .filter((row) => row.transactionCount > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredCategorizedTransactions, state.categories]);

  const expenseChartData = useMemo(
    () =>
      categoryRows
        .filter((row) => row.expense > 0)
        .slice(0, 6)
        .map((row) => ({
          name: row.name,
          total: row.expense,
          fill: getCategoryChartColor(row.color),
        })),
    [categoryRows],
  );

  const incomeChartData = useMemo(
    () =>
      categoryRows
        .filter((row) => row.income > 0)
        .slice(0, 6)
        .map((row) => ({
          name: row.name,
          total: row.income,
          fill: getCategoryChartColor(row.color),
        })),
    [categoryRows],
  );

  const topExpenseCategory = expenseChartData[0];

  const typeOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setMonthFrom("");
    setMonthTo("");
  }

  const summaryCards = [
    {
      title: "Coverage",
      value: `${summary.coverage}%`,
      note: "Transaksi processed yang sudah masuk kategori",
      icon: PieChart,
      className: "border-indigo-200/80 bg-indigo-400/40",
      iconClassName: "bg-indigo-100 text-indigo-500 ring-indigo-200/80",
    },
    {
      title: "Categorized",
      value: String(summary.categorizedCount),
      note: "Sudah cocok ke salah satu rule kategori",
      icon: Tags,
      className: "border-emerald-200/80 bg-emerald-400/40",
      iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
    },
    {
      title: "Top expense category",
      value: topExpenseCategory?.name ?? "-",
      note: topExpenseCategory
        ? formatCurrency(topExpenseCategory.total)
        : "Belum ada pengeluaran terkategori",
      icon: BarChart3,
      className: "border-rose-200/80 bg-rose-400/40",
      iconClassName: "bg-rose-100 text-rose-500 ring-rose-200/80",
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Category Insights</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Category Insights
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Analitik ringkas untuk hasil klasifikasi transaksi processed:
              coverage, distribusi pemasukan dan pengeluaran, serta kategori
              yang masih perlu diperbaiki.
            </p>
          </div>
        </section>

        <Separator />

        <FilterCard>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari kategori, merchant, deskripsi, atau bank"
                  className="border-border bg-background pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Transaction type
              </label>
              <FilterDropdown
                value={typeFilter}
                placeholder="Semua tipe"
                options={typeOptions}
                onChange={(value) =>
                  setTypeFilter(value as "all" | TransactionType)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Bank
              </label>
              <FilterDropdown
                value={bankFilter}
                placeholder="Semua bank"
                options={bankFilterOptions}
                onChange={setBankFilter}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Month from
              </label>
              <Input
                type="month"
                value={monthFrom}
                onChange={(event) => setMonthFrom(event.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Month to
              </label>
              <Input
                type="month"
                value={monthTo}
                onChange={(event) => setMonthTo(event.target.value)}
                className="bg-background"
              />
            </div>
          </div>
        </FilterCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className={item.className}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardDescription>{item.title}</CardDescription>
                      <CardTitle className="mt-1 text-2xl">
                        {item.value}
                      </CardTitle>
                    </div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ring-1 ${item.iconClassName}`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  {item.note}
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Category performance</CardTitle>
              <CardDescription>
                Ringkasan jumlah transaksi serta total pemasukan dan
                pengeluaran per kategori.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Top merchants</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Income</TableHead>
                    <TableHead>Expense</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isHydrated || filteredCategorizedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {!isHydrated
                          ? "Memuat analitik kategori..."
                          : "Belum ada data kategori untuk ditampilkan."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {categoryRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={CATEGORY_COLOR_STYLES[row.color].badge}
                        >
                          {row.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.topMerchants.length > 0 ? (
                          <div className="flex max-w-[320px] flex-wrap gap-1.5">
                            {row.topMerchants.map((merchant) => (
                              <Badge
                                key={`${row.id}-${merchant.name}`}
                                variant="secondary"
                                className="bg-muted text-foreground"
                              >
                                {merchant.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{row.transactionCount}</TableCell>
                      <TableCell>
                        {row.income > 0 ? formatCurrency(row.income) : "-"}
                      </TableCell>
                      <TableCell>
                        {row.expense > 0 ? formatCurrency(row.expense) : "-"}
                      </TableCell>
                      <TableCell>{formatCurrency(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Expense by category</CardTitle>
                <CardDescription>
                  Pengeluaran processed per kategori untuk melihat kategori yang
                  paling dominan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isHydrated || expenseChartData.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada pengeluaran terkategori.
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseChartData} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                        <CartesianGrid stroke={CHART_GRID_STROKE} strokeDasharray="3 3" horizontal={false} />
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
                          width={120}
                          tickLine={false}
                          axisLine={false}
                          tick={CHART_AXIS_TICK}
                        />
                        <RechartsTooltip
                          contentStyle={CHART_TOOLTIP_STYLE}
                          formatter={(value) =>
                            typeof value === "number"
                              ? formatCurrency(value)
                              : "-"
                          }
                        />
                        <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                          {expenseChartData.map((item) => (
                            <Cell key={item.name} fill={item.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Income by category</CardTitle>
                <CardDescription>
                  Kategori pemasukan processed untuk melihat sumber masuk utama.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isHydrated || incomeChartData.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada pemasukan terkategori.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incomeChartData.map((item) => (
                      <div
                        key={item.name}
                        className="space-y-2 rounded-lg border border-border bg-muted/20 px-3 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-foreground">
                            {item.name}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted/40">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(
                                (item.total /
                                  Math.max(...incomeChartData.map((row) => row.total), 1)) *
                                  100,
                                8,
                              )}%`,
                              backgroundColor: item.fill,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
