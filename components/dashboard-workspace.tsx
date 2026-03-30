"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock3,
  Files,
  Landmark,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  CATEGORY_COLOR_STYLES,
  matchTransactionCategory,
} from "@/lib/categories";
import {
  CHART_AXIS_TICK,
  CHART_COLOR_PALETTE,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
} from "@/lib/charts";
import {
  formatCurrency,
  formatDate,
  formatDayMonthLabel,
  formatRelativeTime,
  formatShortMonthLabel,
} from "@/lib/formatters";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DashboardWorkspace() {
  const { state, isHydrated } = useFileWorkspace();

  const processedFiles = useMemo(
    () => state.files.filter((file) => file.status === "processed"),
    [state.files],
  );

  const processedFileNames = useMemo(
    () => new Set(processedFiles.map((file) => file.name)),
    [processedFiles],
  );

  const processedTransactions = useMemo(
    () =>
      state.transactions
        .filter((transaction) => processedFileNames.has(transaction.sourceFile))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [processedFileNames, state.transactions],
  );

  const categorizedProcessedTransactions = useMemo(
    () =>
      processedTransactions.map((transaction) => ({
        ...transaction,
        category: matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        ),
      })),
    [processedTransactions, state.categories, state.merchantMappings],
  );

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let latestBalance: number | null = null;

    for (const transaction of processedTransactions) {
      if (transaction.type === "credit") {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }

      if (latestBalance === null && transaction.balance !== null) {
        latestBalance = transaction.balance;
      }
    }

    return {
      income,
      expense,
      latestBalance,
    };
  }, [processedTransactions]);

  const monthlyChart = useMemo(() => {
    const map = new Map<
      string,
      { month: string; income: number; expense: number; total: number }
    >();

    for (const transaction of processedTransactions) {
      const month = formatShortMonthLabel(transaction.date);
      const current = map.get(month) ?? {
        month,
        income: 0,
        expense: 0,
        total: 0,
      };

      if (transaction.type === "credit") {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      current.total = current.income + current.expense;
      map.set(month, current);
    }

    const items = [...map.values()].slice(0, 6).reverse();
    const maxTotal = Math.max(...items.map((item) => item.total), 1);

    return items.map((item) => ({
      ...item,
      percentage: item.total > 0 ? (item.total / maxTotal) * 100 : 0,
    }));
  }, [processedTransactions]);

  const bankDistribution = useMemo(() => {
    const map = new Map<string, number>();

    for (const file of processedFiles) {
      map.set(file.bank, (map.get(file.bank) ?? 0) + file.transactionCount);
    }

    const items = [...map.entries()]
      .map(([bank, count]) => ({ bank, count }))
      .sort((a, b) => b.count - a.count);
    const maxCount = Math.max(...items.map((item) => item.count), 1);

    return items.map((item) => ({
      ...item,
      percentage: (item.count / maxCount) * 100,
    }));
  }, [processedFiles]);

  const dailyBalanceChart = useMemo(() => {
    const balanceByDay = new Map<string, { label: string; balance: number }>();

    for (const transaction of [...processedTransactions].reverse()) {
      if (transaction.balance === null) {
        continue;
      }

      const dayKey = transaction.date.slice(0, 10);
      balanceByDay.set(dayKey, {
        label: formatDayMonthLabel(transaction.date),
        balance: transaction.balance,
      });
    }

    const items = [...balanceByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([, value]) => value);

    const nonZeroItems = items.filter((item) => item.balance !== 0);

    if (nonZeroItems.length === 0) {
      return [];
    }

    return nonZeroItems;
  }, [processedTransactions]);

  const categoryInsights = useMemo(() => {
    const expenseMap = new Map<
      string,
      { name: string; color: keyof typeof CATEGORY_COLOR_STYLES; total: number; count: number }
    >();
    const incomeMap = new Map<
      string,
      { name: string; color: keyof typeof CATEGORY_COLOR_STYLES; total: number; count: number }
    >();

    for (const transaction of categorizedProcessedTransactions) {
      const targetMap =
        transaction.type === "credit" ? incomeMap : expenseMap;
      const categoryId = transaction.category?.id ?? "uncategorized";
      const categoryName = transaction.category?.name ?? "Uncategorized";
      const categoryColor = transaction.category?.color ?? "amber";
      const current = targetMap.get(categoryId) ?? {
        name: categoryName,
        color: categoryColor,
        total: 0,
        count: 0,
      };

      current.total += transaction.amount;
      current.count += 1;
      targetMap.set(categoryId, current);
    }

    const toSortedArray = (
      map: Map<
        string,
        { name: string; color: keyof typeof CATEGORY_COLOR_STYLES; total: number; count: number }
      >,
    ) =>
      [...map.entries()]
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

    return {
      expense: toSortedArray(expenseMap),
      income: toSortedArray(incomeMap),
    };
  }, [categorizedProcessedTransactions]);

  const recentTransactions = useMemo(
    () => processedTransactions.slice(0, 8),
    [processedTransactions],
  );
  const latestFiles = useMemo(() => state.files.slice(0, 6), [state.files]);

  const summaryCards = [
    {
      title: "Processed files",
      value: String(processedFiles.length),
      note: `${state.files.filter((file) => file.status === "review").length} file masih review`,
      icon: Files,
      cardClassName: "border-indigo-200/90 bg-indigo-50/80",
      iconWrapClassName: "bg-indigo-100 ring-indigo-200/80",
      iconClassName: "text-indigo-500",
    },
    {
      title: "Processed transactions",
      value: String(processedTransactions.length),
      note: "Hanya data final yang ditampilkan",
      icon: Activity,
      cardClassName: "border-sky-200/90 bg-sky-50/80",
      iconWrapClassName: "bg-sky-100 ring-sky-200/80",
      iconClassName: "text-sky-500",
    },
    {
      title: "Total income",
      value: formatCurrency(totals.income),
      note: "Akumulasi credit dari file processed",
      icon: ArrowUpCircle,
      cardClassName: "border-emerald-200/90 bg-emerald-50/80",
      iconWrapClassName: "bg-emerald-100 ring-emerald-200/80",
      iconClassName: "text-emerald-500",
    },
    {
      title: "Total expense",
      value: formatCurrency(totals.expense),
      note: "Akumulasi debit dari file processed",
      icon: ArrowDownCircle,
      cardClassName: "border-rose-200/90 bg-rose-50/80",
      iconWrapClassName: "bg-rose-100 ring-rose-200/80",
      iconClassName: "text-rose-500",
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage />
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Dashboard
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Ringkasan visual untuk file processed, transaksi final, arus masuk
              dan keluar, serta status data workspace MBG.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button render={<Link href="/file" />}>Upload PDF</Button>
            <Button variant="outline" render={<Link href="/transactions" />}>
              Open transactions
            </Button>
          </div>
        </section>

        <Separator className="bg-white/70" />

        <section className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className={`${item.cardClassName} self-start`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardDescription className="truncate whitespace-nowrap text-[10px] font-semibold tracking-[0.12em] uppercase">
                        {item.title}
                      </CardDescription>
                      <CardTitle className="mt-1 text-2xl">
                        {item.value}
                      </CardTitle>
                    </div>
                    <div
                      className={`flex size-11 items-center justify-center rounded-2xl ring-1 ${item.iconWrapClassName}`}
                    >
                      <Icon className={`size-4 ${item.iconClassName}`} />
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

        <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="min-w-0 space-y-6 self-start">
            <Card className="self-start">
              <CardHeader>
                <CardTitle>Monthly transaction volume</CardTitle>
                <CardDescription>
                  Visual sederhana dari total nominal transaksi per bulan untuk
                  file yang sudah processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isHydrated || monthlyChart.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada data processed yang cukup untuk divisualisasikan.
                  </div>
                ) : (
                  <div className="space-y-4 overflow-x-auto pb-1">
                    <div className="min-w-[32rem] space-y-4">
                    {monthlyChart.map((item) => (
                      <div key={item.month} className="space-y-2 rounded-xl bg-white/55 px-3 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {item.month}
                          </span>
                          <span className="text-muted-foreground">
                            {formatCurrency(item.total)}
                          </span>
                        </div>
                        <div className="flex h-3 overflow-hidden rounded-full bg-white/70">
                          <div
                            className="h-full bg-sky-400"
                            style={{
                              width:
                                item.total > 0
                                  ? `${Math.max((item.income / item.total) * item.percentage, item.income > 0 ? 4 : 0)}%`
                                  : "0%",
                            }}
                          />
                          <div
                            className="h-full bg-rose-400"
                            style={{
                              width:
                                item.total > 0
                                  ? `${Math.max((item.expense / item.total) * item.percentage, item.expense > 0 ? 4 : 0)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Credit {formatCurrency(item.income)}</span>
                          <span>Debit {formatCurrency(item.expense)}</span>
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Daily balance trend</CardTitle>
                <CardDescription>
                  Diagram garis saldo terakhir per hari dari transaksi
                  processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyBalanceChart.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada data saldo harian untuk divisualisasikan.
                  </div>
                ) : (
                  <div className="space-y-4 overflow-x-auto pb-1">
                    <div className="min-w-[34rem] rounded-xl border border-border bg-white/55 p-4">
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={dailyBalanceChart}
                            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
                          >
                            <CartesianGrid
                              stroke={CHART_GRID_STROKE}
                              strokeDasharray="3 3"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="label"
                              tickLine={false}
                              axisLine={false}
                              tick={CHART_AXIS_TICK}
                            />
                            <YAxis
                              tickLine={false}
                              axisLine={false}
                              width={64}
                              tick={CHART_AXIS_TICK}
                              tickFormatter={(value: number) =>
                                new Intl.NumberFormat("id-ID", {
                                  notation: "compact",
                                  maximumFractionDigits: 1,
                                }).format(value)
                              }
                            />
                            <RechartsTooltip
                              contentStyle={CHART_TOOLTIP_STYLE}
                              formatter={(value) =>
                                typeof value === "number"
                                  ? formatCurrency(value)
                                  : "-"
                              }
                            />
                            <Line
                              type="monotone"
                              dataKey="balance"
                              stroke={CHART_COLOR_PALETTE.indigo}
                              strokeWidth={3}
                              dot={{
                                r: 4,
                                fill: CHART_COLOR_PALETTE.indigo,
                                strokeWidth: 0,
                              }}
                              activeDot={{
                                r: 5,
                                fill: CHART_COLOR_PALETTE.indigo,
                                strokeWidth: 0,
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Recent processed transactions</CardTitle>
                <CardDescription>
                  Transaksi terbaru yang sudah masuk ke data final.
                </CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <Table className="min-w-[42rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>File</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          Belum ada transaksi processed.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{formatDate(transaction.date)}</TableCell>
                        <TableCell className="max-w-[320px] truncate">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              transaction.type === "credit"
                                ? "border-sky-200 bg-sky-50 text-sky-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {transaction.sourceFile}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Top expense categories</CardTitle>
                <CardDescription>
                  Kategori pengeluaran terbesar dari transaksi processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryInsights.expense.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada kategori pengeluaran untuk ditampilkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryInsights.expense.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white/55 px-3 py-3"
                      >
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={CATEGORY_COLOR_STYLES[item.color].badge}
                          >
                            {item.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {item.count} transaksi
                          </p>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6 self-start">
            <Card className="self-start">
              <CardHeader>
                <CardTitle>Latest balance</CardTitle>
                <CardDescription>
                  Saldo terakhir yang berhasil ditemukan dari transaksi
                  processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-border bg-white/55 p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Landmark className="size-4" />
                    <span className="text-sm">Available balance</span>
                  </div>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {totals.latestBalance === null
                      ? "-"
                      : formatCurrency(totals.latestBalance)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Bank distribution</CardTitle>
                <CardDescription>
                  Distribusi jumlah transaksi dari file processed per bank.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bankDistribution.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada bank yang memiliki data processed.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bankDistribution.map((item) => (
                      <div key={item.bank} className="space-y-2 rounded-xl bg-white/55 px-3 py-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {item.bank}
                          </span>
                          <span className="text-muted-foreground">
                            {item.count} transaksi
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/70">
                          <div
                            className="h-full rounded-full bg-sky-400"
                            style={{
                              width: `${Math.max(item.percentage, 10)}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Top income categories</CardTitle>
                <CardDescription>
                  Kategori pemasukan terbesar dari transaksi processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryInsights.income.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada kategori pemasukan untuk ditampilkan.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryInsights.income.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white/55 px-3 py-3"
                      >
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={CATEGORY_COLOR_STYLES[item.color].badge}
                          >
                            {item.name}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {item.count} transaksi
                          </p>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="self-start">
              <CardHeader>
                <CardTitle>Latest files status</CardTitle>
                <CardDescription>
                  Snapshot file terbaru untuk melihat mana yang sudah processed
                  dan mana yang masih menunggu review.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestFiles.length === 0 ? (
                  <div className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada file di workspace.
                  </div>
                ) : null}
                {latestFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-border bg-white/55 px-3 py-3"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {file.bank} · {file.transactionCount} transaksi
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={
                          file.status === "processed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {file.status === "processed"
                          ? "Processed"
                          : "Review needed"}
                      </Badge>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 className="size-3.5" />
                        {formatRelativeTime(file.uploadedAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
