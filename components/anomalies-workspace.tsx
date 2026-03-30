"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ScanSearch,
  Search,
  Tags,
} from "lucide-react";

import {
  AmountDistributionCard,
  type AmountDistributionRange,
} from "@/components/amount-distribution-card";
import { FilterCard } from "@/components/filter-card";
import { FilterDropdown } from "@/components/filter-dropdown";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { CATEGORY_COLOR_STYLES } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  buildAmountAnomalyStats,
  mean,
  standardDeviation,
} from "@/lib/review-alerts";
import {
  buildProcessedTransactions,
  type ProcessedTransaction,
} from "@/lib/transaction-review";
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

type CategoryAlert = ProcessedTransaction & {
  categoryMean: number;
  categoryStdDev: number;
  categoryZScore: number;
};

type SameDayCluster = {
  date: string;
  description: string;
  amount: number;
  count: number;
  type: ProcessedTransaction["type"];
  banks: string[];
  categoryIds: string[];
};

function normalizeDescription(description: string) {
  return description.toLowerCase().replace(/\s+/g, " ").trim();
}

function formatDeltaCurrency(value: number) {
  const rounded = Math.round(Math.abs(value));
  const formatted = formatCurrency(rounded);

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function buildTransactionsHref(
  filters: Record<string, string | null | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value && value.trim()) {
      params.set(key, value);
    }
  }

  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function ReviewAlertsWorkspace() {
  const router = useRouter();
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const processedTransactions = useMemo(
    () =>
      buildProcessedTransactions(
        state.files,
        state.transactions,
        state.categories,
        state.merchantMappings,
      ),
    [state.categories, state.files, state.merchantMappings, state.transactions],
  );

  const anomalyStats = useMemo(
    () => buildAmountAnomalyStats(processedTransactions),
    [processedTransactions],
  );

  const amountOutliers = useMemo(() => {
    return processedTransactions
      .map((transaction) => {
        const zScore =
          anomalyStats.stdDev > 0
            ? (transaction.amount - anomalyStats.mean) / anomalyStats.stdDev
            : 0;

        const isIqrOutlier = transaction.amount >= anomalyStats.iqrUpper;
        const isZScoreOutlier =
          transaction.amount >= anomalyStats.zScoreThreshold;

        return {
          ...transaction,
          anomalyBasis:
            isIqrOutlier && isZScoreOutlier
              ? "Di atas batas IQR dan deviasi tinggi"
              : isIqrOutlier
                ? "Di atas batas IQR"
                : isZScoreOutlier
                  ? "Jauh di atas rata-rata"
                  : null,
          zScore,
        };
      })
      .filter((transaction) => transaction.anomalyBasis)
      .sort((a, b) => b.amount - a.amount);
  }, [
    anomalyStats.iqrUpper,
    anomalyStats.mean,
    anomalyStats.stdDev,
    anomalyStats.zScoreThreshold,
    processedTransactions,
  ]);

  const categoryAlerts = useMemo(() => {
    const byCategory = new Map<string, ProcessedTransaction[]>();

    for (const transaction of processedTransactions) {
      if (!transaction.category) {
        continue;
      }

      const key = transaction.category.id;
      const current = byCategory.get(key) ?? [];
      current.push(transaction);
      byCategory.set(key, current);
    }

    const results: CategoryAlert[] = [];

    for (const transactions of byCategory.values()) {
      if (transactions.length < 4) {
        continue;
      }

      const values = transactions.map((transaction) => transaction.amount);
      const average = mean(values);
      const stdDev = standardDeviation(values, average);

      if (stdDev === 0) {
        continue;
      }

      for (const transaction of transactions) {
        const categoryZScore = (transaction.amount - average) / stdDev;

        if (categoryZScore >= 2) {
          results.push({
            ...transaction,
            categoryMean: average,
            categoryStdDev: stdDev,
            categoryZScore,
          });
        }
      }
    }

    return results
      .sort((a, b) => b.categoryZScore - a.categoryZScore)
      .slice(0, 20);
  }, [processedTransactions]);

  const sameDayClusters = useMemo<SameDayCluster[]>(() => {
    const map = new Map<
      string,
      {
        date: string;
        description: string;
        amount: number;
        count: number;
        type: ProcessedTransaction["type"];
        banks: Set<string>;
        categoryIds: Set<string>;
      }
    >();

    for (const transaction of processedTransactions) {
      const key = `${transaction.date.slice(0, 10)}|${transaction.type}|${transaction.amount}|${normalizeDescription(transaction.description)}`;
      const current = map.get(key) ?? {
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        count: 0,
        type: transaction.type,
        banks: new Set<string>(),
        categoryIds: new Set<string>(),
      };

      current.count += 1;
      current.banks.add(transaction.bank);
      if (transaction.category?.id) {
        current.categoryIds.add(transaction.category.id);
      }
      map.set(key, current);
    }

    return [...map.values()]
      .filter((item) => item.count >= 2)
      .map((item) => ({
        ...item,
        banks: [...item.banks].sort(),
        categoryIds: [...item.categoryIds].sort(),
      }))
      .sort((a, b) => b.count - a.count || b.amount - a.amount)
      .slice(0, 12);
  }, [processedTransactions]);

  const bankOptions = useMemo(
    () => [...new Set(processedTransactions.map((transaction) => transaction.bank))].sort(),
    [processedTransactions],
  );

  const typeOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  const bankFilterOptions = [
    { value: "all", label: "Semua bank" },
    ...bankOptions.map((bank) => ({ value: bank, label: bank })),
  ];

  const categoryFilterOptions = useMemo(
    () => [
      { value: "all", label: "Semua kategori" },
      ...state.categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
      { value: "uncategorized", label: "Uncategorized" },
    ],
    [state.categories],
  );

  const filteredAmountOutliers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = amountMin.trim() ? Number(amountMin) : null;
    const max = amountMax.trim() ? Number(amountMax) : null;

    return amountOutliers.filter((transaction) => {
      if (
        query &&
        !`${transaction.description} ${transaction.sourceFile} ${transaction.bank}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }

      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      if (bankFilter !== "all" && transaction.bank !== bankFilter) {
        return false;
      }

      if (categoryFilter === "uncategorized" && transaction.category) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        categoryFilter !== "uncategorized" &&
        transaction.category?.id !== categoryFilter
      ) {
        return false;
      }

      if (min !== null && !Number.isNaN(min) && transaction.amount < min) {
        return false;
      }

      if (max !== null && !Number.isNaN(max) && transaction.amount > max) {
        return false;
      }

      return true;
    });
  }, [amountMax, amountMin, amountOutliers, bankFilter, categoryFilter, search, typeFilter]);

  const filteredCategoryAlerts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = amountMin.trim() ? Number(amountMin) : null;
    const max = amountMax.trim() ? Number(amountMax) : null;

    return categoryAlerts.filter((transaction) => {
      if (
        query &&
        !`${transaction.description} ${transaction.sourceFile} ${transaction.bank}`
          .toLowerCase()
          .includes(query)
      ) {
        return false;
      }

      if (typeFilter !== "all" && transaction.type !== typeFilter) {
        return false;
      }

      if (bankFilter !== "all" && transaction.bank !== bankFilter) {
        return false;
      }

      if (categoryFilter === "uncategorized" && transaction.category) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        categoryFilter !== "uncategorized" &&
        transaction.category?.id !== categoryFilter
      ) {
        return false;
      }

      if (min !== null && !Number.isNaN(min) && transaction.amount < min) {
        return false;
      }

      if (max !== null && !Number.isNaN(max) && transaction.amount > max) {
        return false;
      }

      return true;
    });
  }, [amountMax, amountMin, bankFilter, categoryAlerts, categoryFilter, search, typeFilter]);

  const filteredSameDayClusters = useMemo(() => {
    const query = search.trim().toLowerCase();
    const min = amountMin.trim() ? Number(amountMin) : null;
    const max = amountMax.trim() ? Number(amountMax) : null;

    return sameDayClusters.filter((item) => {
      if (query && !item.description.toLowerCase().includes(query)) {
        return false;
      }

      if (typeFilter !== "all" && item.type !== typeFilter) {
        return false;
      }

      if (bankFilter !== "all" && !item.banks.includes(bankFilter)) {
        return false;
      }

      if (categoryFilter === "uncategorized" && item.categoryIds.length > 0) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        categoryFilter !== "uncategorized" &&
        !item.categoryIds.includes(categoryFilter)
      ) {
        return false;
      }

      if (min !== null && !Number.isNaN(min) && item.amount < min) {
        return false;
      }

      if (max !== null && !Number.isNaN(max) && item.amount > max) {
        return false;
      }

      return true;
    });
  }, [amountMax, amountMin, bankFilter, categoryFilter, sameDayClusters, search, typeFilter]);

  const selectedAmountRange = useMemo<AmountDistributionRange | null>(() => {
    if (!amountMin.trim() || !amountMax.trim()) {
      return null;
    }

    const min = Number(amountMin);
    const max = Number(amountMax);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      return null;
    }

    return {
      rangeLabel: `${formatCurrency(min)} - ${formatCurrency(max)}`,
      rangeStart: min,
      rangeEnd: max + 1,
      filterMax: max,
    };
  }, [amountMax, amountMin]);

  const summaryCards = [
    {
      title: "Large amount",
      value: String(filteredAmountOutliers.length),
      note:
        anomalyStats.iqrUpper > 0
          ? `Alert nominal besar di atas ${formatCurrency(Math.round(anomalyStats.iqrUpper))}`
          : "Belum ada threshold",
      icon: AlertTriangle,
      className: "border-rose-200/80 bg-rose-400/40",
      iconClassName: "bg-rose-100 text-rose-500 ring-rose-200/80",
    },
    {
      title: "Off-category",
      value: String(filteredCategoryAlerts.length),
      note: "Tidak wajar dibanding kategori yang sama",
      icon: Tags,
      className: "border-amber-200/80 bg-amber-400/40",
      iconClassName: "bg-amber-100 text-amber-600 ring-amber-200/80",
    },
    {
      title: "Possible duplicate",
      value: String(filteredSameDayClusters.length),
      note: "Transaksi identik di hari yang sama",
      icon: ScanSearch,
      className: "border-sky-200/80 bg-sky-400/40",
      iconClassName: "bg-sky-100 text-sky-500 ring-sky-200/80",
    },
  ];

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setCategoryFilter("all");
    setAmountMin("");
    setAmountMax("");
  }

  function applyAmountBucket(range: AmountDistributionRange) {
    setAmountMin(String(range.rangeStart));
    setAmountMax(String(range.filterMax));
  }

  function openSelectedAmountRangeInTransactions() {
    if (!selectedAmountRange) {
      return;
    }

    router.push(
      buildTransactionsHref({
        search: search || undefined,
        type: typeFilter === "all" ? undefined : typeFilter,
        bank: bankFilter === "all" ? undefined : bankFilter,
        category: categoryFilter === "all" ? undefined : categoryFilter,
        amount_min: String(selectedAmountRange.rangeStart),
        amount_max: String(selectedAmountRange.filterMax),
      }),
    );
  }

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
                <BreadcrumbPage>Anomalies</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Anomalies
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Halaman ini menandai transaksi processed yang sebaiknya dicek
              ulang sebelum dipakai di report: nominal terlalu besar, tidak
              wajar dalam kategori, atau kemungkinan duplikat.
            </p>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className={item.className}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardDescription>{item.title}</CardDescription>
                      <CardTitle className="mt-1 text-2xl">{item.value}</CardTitle>
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
                    placeholder="Cari deskripsi, file, atau bank"
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
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <FilterDropdown
                  value={categoryFilter}
                  placeholder="Semua kategori"
                  options={categoryFilterOptions}
                  onChange={setCategoryFilter}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Minimum amount
                </label>
                <Input
                  inputMode="numeric"
                  placeholder="Nominal minimum"
                  value={amountMin}
                  onChange={(event) => setAmountMin(event.target.value)}
                  className="border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Maximum amount
                </label>
                <Input
                  inputMode="numeric"
                  placeholder="Nominal maksimum"
                  value={amountMax}
                  onChange={(event) => setAmountMax(event.target.value)}
                  className="border-border bg-background"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
        </FilterCard>

        <AmountDistributionCard
          transactions={processedTransactions}
          isHydrated={isHydrated}
          selectedRange={selectedAmountRange}
          onSelectRange={applyAmountBucket}
          onClearSelectedRange={() => {
            setAmountMin("");
            setAmountMax("");
          }}
          onOpenSelectedRange={openSelectedAmountRangeInTransactions}
        />

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Possible duplicate</CardTitle>
            <CardDescription>
              Transaksi identik di hari yang sama yang layak dicek ulang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || filteredSameDayClusters.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat potensi duplikasi..."
                        : "Belum ada cluster transaksi yang mencurigakan."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredSameDayClusters.map((item) => (
                  <TableRow
                    key={`${item.date}-${item.type}-${item.amount}-${item.description}`}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        buildTransactionsHref({
                          search: item.description,
                          type: item.type,
                          amount_min: String(item.amount),
                          amount_max: String(item.amount),
                          date_from: item.date.slice(0, 10),
                          date_to: item.date.slice(0, 10),
                          bank: item.banks.length === 1 ? item.banks[0] : undefined,
                          category:
                            item.categoryIds.length === 1
                              ? item.categoryIds[0]
                              : item.categoryIds.length === 0
                                ? "uncategorized"
                                : undefined,
                        }),
                      )
                    }
                  >
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {item.description}
                    </TableCell>
                    <TableCell className="capitalize">{item.type}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Large amount alerts</CardTitle>
            <CardDescription>
              Transaksi yang jauh lebih besar dari pola nominal umum.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">
                Mean {formatCurrency(Math.round(anomalyStats.mean))}
              </Badge>
              <Badge variant="outline">
                IQR upper {formatCurrency(Math.round(anomalyStats.iqrUpper))}
              </Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Why flagged</TableHead>
                  <TableHead>Vs mean</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || filteredAmountOutliers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat alert nominal besar..."
                        : "Belum ada transaksi yang melewati threshold nominal besar."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredAmountOutliers.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        buildTransactionsHref({
                          transaction_id: transaction.id,
                        }),
                      )
                    }
                  >
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="max-w-[360px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      {transaction.category ? (
                        <Badge
                          variant="outline"
                          className={
                            CATEGORY_COLOR_STYLES[transaction.category.color].badge
                          }
                        >
                          {transaction.category.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px] whitespace-normal text-muted-foreground">
                      {transaction.anomalyBasis}
                    </TableCell>
                    <TableCell>
                      {formatDeltaCurrency(transaction.amount - anomalyStats.mean)}
                    </TableCell>
                    <TableCell className="capitalize">{transaction.type}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Off-category alerts</CardTitle>
            <CardDescription>
              Transaksi yang nominalnya jauh di atas pola kategori yang sama.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Typical amount</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || filteredCategoryAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat alert per kategori..."
                        : "Belum ada transaksi yang terlihat menyimpang dalam kategorinya."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredCategoryAlerts.map((transaction) => (
                  <TableRow
                    key={`${transaction.id}-category-alert`}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                    onClick={() =>
                      router.push(
                        buildTransactionsHref({
                          transaction_id: transaction.id,
                        }),
                      )
                    }
                  >
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="max-w-[320px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          transaction.category
                            ? CATEGORY_COLOR_STYLES[transaction.category.color].badge
                            : undefined
                        }
                      >
                        {transaction.category?.name ?? "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Math.round(transaction.categoryMean))}
                    </TableCell>
                    <TableCell>
                      {formatDeltaCurrency(
                        transaction.amount - transaction.categoryMean,
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
