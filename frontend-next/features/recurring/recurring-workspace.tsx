"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarClock,
  ExternalLink,
  History,
  Repeat2,
  Search,
} from "lucide-react";

import { FilterCard } from "@/components/filters/filter-card";
import { FilterDropdown } from "@/components/filters/filter-dropdown";
import { CATEGORY_COLOR_STYLES } from "@/lib/categories";
import {
  detectRecurringPatterns,
  type DetectedRecurringPattern,
  type RecurringConfidence,
} from "@/lib/recurring";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  buildProcessedTransactions,
  buildRepeatedTransactionPatterns,
} from "@/lib/transaction-review";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { TransactionType } from "@/types/transaction";

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

function TypeBadge({ type }: { type: TransactionType }) {
  if (type === "credit") {
    return (
      <Badge
        variant="outline"
        className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300"
      >
        Credit
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
    >
      Debit
    </Badge>
  );
}

function ConfidenceBadge({
  confidence,
  label,
}: {
  confidence: RecurringConfidence;
  label: string;
}) {
  const className =
    confidence === "high"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
      : confidence === "medium"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300";

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

function DueBadge({ daysUntilNext }: { daysUntilNext: number }) {
  const className =
    daysUntilNext < 0
      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
      : daysUntilNext <= 3
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
        : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/40 dark:text-sky-300";

  return (
    <Badge variant="outline" className={className}>
      {formatDueText(daysUntilNext)}
    </Badge>
  );
}

function formatDueText(daysUntilNext: number) {
  if (daysUntilNext === 0) {
    return "Due today";
  }

  if (daysUntilNext === 1) {
    return "Besok";
  }

  if (daysUntilNext > 1) {
    return `${daysUntilNext} hari lagi`;
  }

  if (daysUntilNext === -1) {
    return "Terlambat 1 hari";
  }

  return `Terlambat ${Math.abs(daysUntilNext)} hari`;
}

function formatInterval(days: number) {
  return `~${Math.round(days)} hari`;
}

function PatternHistoryInline({
  pattern,
}: {
  pattern: DetectedRecurringPattern;
}) {
  return (
    <div className="space-y-5 p-2">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Occurrences
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {pattern.count}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Average interval
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {formatInterval(pattern.averageIntervalDays)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Match rate
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {Math.round(pattern.matchRate * 100)}%
          </p>
        </div>
        <div className="rounded-xl border border-border bg-background px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Monthly effect
          </p>
          <p className="mt-2 text-xl font-semibold text-foreground">
            {formatCurrency(Math.round(pattern.monthlyEstimate))}
          </p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Gap</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead>Source file</TableHead>
            <TableHead>Deskripsi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pattern.transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{formatDate(transaction.date)}</TableCell>
              <TableCell>
                {transaction.intervalFromPrevious === null
                  ? "-"
                  : `${transaction.intervalFromPrevious} hari`}
              </TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.bank}</TableCell>
              <TableCell className="max-w-[180px] truncate">
                {transaction.sourceFile}
              </TableCell>
              <TableCell className="max-w-[320px] truncate">
                {transaction.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function RecurringWorkspace() {
  const router = useRouter();
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cadenceFilter, setCadenceFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  const patterns = useMemo(() => detectRecurringPatterns(state), [state]);
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
  const filteredProcessedTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return processedTransactions.filter((transaction) => {
      const matchesSearch =
        !query ||
        `${transaction.description} ${transaction.bank} ${transaction.category?.name ?? ""}`
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;
      const matchesBank =
        bankFilter === "all" || transaction.bank === bankFilter;
      const matchesCategory =
        categoryFilter === "all"
          ? true
          : categoryFilter === "uncategorized"
            ? transaction.category === null
            : transaction.category?.id === categoryFilter;

      return matchesSearch && matchesType && matchesBank && matchesCategory;
    });
  }, [bankFilter, categoryFilter, processedTransactions, search, typeFilter]);

  const repeatedPatterns = useMemo(
    () => buildRepeatedTransactionPatterns(filteredProcessedTransactions),
    [filteredProcessedTransactions],
  );

  const filteredPatterns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return patterns.filter((pattern) => {
      const matchesSearch =
        !query ||
        `${pattern.merchantName} ${pattern.descriptionSample} ${pattern.categoryName ?? ""}`
          .toLowerCase()
          .includes(query);

      const matchesType =
        typeFilter === "all" || pattern.type === typeFilter;
      const matchesBank =
        bankFilter === "all" || pattern.banks.includes(bankFilter);
      const matchesCategory =
        categoryFilter === "all"
          ? true
          : categoryFilter === "uncategorized"
            ? pattern.categoryId === null
            : pattern.categoryId === categoryFilter;
      const matchesCadence =
        cadenceFilter === "all" || pattern.cadence === cadenceFilter;
      const matchesConfidence =
        confidenceFilter === "all" || pattern.confidence === confidenceFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesBank &&
        matchesCategory &&
        matchesCadence &&
        matchesConfidence
      );
    });
  }, [
    bankFilter,
    cadenceFilter,
    categoryFilter,
    confidenceFilter,
    patterns,
    search,
    typeFilter,
  ]);

  const activePatternId = useMemo(() => {
    if (
      selectedPatternId &&
      filteredPatterns.some((pattern) => pattern.id === selectedPatternId)
    ) {
      return selectedPatternId;
    }

    return null;
  }, [filteredPatterns, selectedPatternId]);

  const upcomingPatterns = useMemo(
    () =>
      filteredPatterns
        .filter((pattern) => pattern.daysUntilNext >= -3 && pattern.daysUntilNext <= 10)
        .sort((a, b) => a.daysUntilNext - b.daysUntilNext)
        .slice(0, 6),
    [filteredPatterns],
  );

  const summary = useMemo(() => {
    const debitEstimate = filteredPatterns
      .filter((pattern) => pattern.type === "debit")
      .reduce((sum, pattern) => sum + pattern.monthlyEstimate, 0);
    const creditEstimate = filteredPatterns
      .filter((pattern) => pattern.type === "credit")
      .reduce((sum, pattern) => sum + pattern.monthlyEstimate, 0);

    return {
      total: filteredPatterns.length,
      dueSoon: filteredPatterns.filter(
        (pattern) => pattern.daysUntilNext >= -3 && pattern.daysUntilNext <= 7,
      ).length,
      debitEstimate,
      creditEstimate,
    };
  }, [filteredPatterns]);

  const typeFilterOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  const cadenceFilterOptions = [
    { value: "all", label: "Semua cadence" },
    { value: "weekly", label: "Mingguan" },
    { value: "biweekly", label: "2 mingguan" },
    { value: "monthly", label: "Bulanan" },
    { value: "quarterly", label: "Kuartalan" },
  ];

  const confidenceFilterOptions = [
    { value: "all", label: "Semua confidence" },
    { value: "high", label: "High confidence" },
    { value: "medium", label: "Medium confidence" },
    { value: "low", label: "Low confidence" },
  ];

  const bankFilterOptions = useMemo(
    () => [
      { value: "all", label: "Semua bank" },
      ...[...new Set(processedTransactions.map((transaction) => transaction.bank))]
        .sort((a, b) => a.localeCompare(b))
        .map((bank) => ({
          value: bank,
          label: bank,
        })),
    ],
    [processedTransactions],
  );

  const categoryFilterOptions = useMemo(() => {
    const categoryMap = new Map<string, string>();
    let hasUncategorized = false;

    for (const transaction of processedTransactions) {
      if (transaction.category) {
        categoryMap.set(transaction.category.id, transaction.category.name);
      } else {
        hasUncategorized = true;
      }
    }

    const options = [
      { value: "all", label: "Semua kategori" },
      ...[...categoryMap.entries()]
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({
          value,
          label,
        })),
    ];

    if (hasUncategorized) {
      options.push({
        value: "uncategorized",
        label: "Uncategorized",
      });
    }

    return options;
  }, [processedTransactions]);

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setCategoryFilter("all");
    setCadenceFilter("all");
    setConfidenceFilter("all");
  }

  function openPatternTransactions(pattern: DetectedRecurringPattern) {
    router.push(
      buildTransactionsHref({
        search: pattern.merchantName,
        type: pattern.type,
        bank: pattern.banks.length === 1 ? pattern.banks[0] : undefined,
        category: pattern.categoryId ?? undefined,
        amount_min: String(pattern.minAmount),
        amount_max: String(pattern.maxAmount),
      }),
    );
  }

  function openRepeatedTransactions(item: (typeof repeatedPatterns)[number]) {
    router.push(
      buildTransactionsHref({
        search: item.description,
        type: item.type,
        amount_min: String(item.amount),
        amount_max: String(item.amount),
      }),
    );
  }

  const summaryCards = [
    {
      title: "Recurring patterns",
      value: String(summary.total),
      note: "Pattern terdeteksi dari file processed",
      icon: Repeat2,
      className: "border-indigo-200/80 bg-indigo-400/40",
      iconClassName: "bg-indigo-100 text-indigo-500 ring-indigo-200/80",
    },
    {
      title: "Due soon",
      value: String(summary.dueSoon),
      note: "Jatuh tempo dalam 7 hari",
      icon: CalendarClock,
      className: "border-amber-200/80 bg-amber-400/40",
      iconClassName: "bg-amber-100 text-amber-500 ring-amber-200/80",
    },
    {
      title: "Monthly debit estimate",
      value: formatCurrency(Math.round(summary.debitEstimate)),
      note: "Perkiraan recurring expense per bulan",
      icon: ArrowDownCircle,
      className: "border-rose-200/80 bg-rose-400/40",
      iconClassName: "bg-rose-100 text-rose-500 ring-rose-200/80",
    },
    {
      title: "Monthly credit estimate",
      value: formatCurrency(Math.round(summary.creditEstimate)),
      note: "Perkiraan recurring income per bulan",
      icon: ArrowUpCircle,
      className: "border-emerald-200/80 bg-emerald-400/40",
      iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
    },
  ];

  return (
    <TooltipProvider>
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
                <BreadcrumbPage>Recurring</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Recurring detection
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Deteksi otomatis transaksi yang terlihat berulang berdasarkan
              merchant, kestabilan nominal, dan pola jarak tanggal dari file yang
              sudah berstatus processed.
            </p>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl ring-1",
                        item.iconClassName,
                      )}
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
                  placeholder="Cari merchant, deskripsi, atau kategori"
                  className="border-border bg-background pl-8"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
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
                options={typeFilterOptions}
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
                Cadence
              </label>
              <FilterDropdown
                value={cadenceFilter}
                placeholder="Semua cadence"
                options={cadenceFilterOptions}
                onChange={setCadenceFilter}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Confidence
              </label>
              <FilterDropdown
                value={confidenceFilter}
                placeholder="Semua confidence"
                options={confidenceFilterOptions}
                onChange={setConfidenceFilter}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </div>
        </FilterCard>

        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Detected patterns</CardTitle>
              <CardDescription>
                Klik row untuk membuka histori transaksi tepat di bawah pattern
                yang dipilih.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Cadence</TableHead>
                    <TableHead>Typical amount</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Next expected</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isHydrated || filteredPatterns.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {!isHydrated
                          ? "Memuat recurring patterns..."
                          : "Belum ada recurring pattern yang memenuhi threshold deteksi."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {filteredPatterns.map((pattern) => (
                    <Fragment key={pattern.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/40",
                          pattern.id === activePatternId &&
                            "bg-indigo-50/70 dark:bg-indigo-950/20",
                        )}
                        onClick={() => openPatternTransactions(pattern)}
                      >
                        <TableCell className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              {pattern.merchantName}
                            </span>
                            <TypeBadge type={pattern.type} />
                            {pattern.categoryName ? (
                              <Badge
                                variant="outline"
                                className={
                                  pattern.categoryColor
                                    ? CATEGORY_COLOR_STYLES[pattern.categoryColor]
                                        .badge
                                    : undefined
                                }
                              >
                                {pattern.categoryName}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="max-w-[340px] truncate text-xs text-muted-foreground">
                            {pattern.descriptionSample}
                          </p>
                        </TableCell>
                        <TableCell>{pattern.cadenceLabel}</TableCell>
                        <TableCell>
                          {formatCurrency(pattern.typicalAmount)}
                        </TableCell>
                        <TableCell>{pattern.count}</TableCell>
                        <TableCell className="space-y-1">
                          <p>{formatDate(pattern.nextExpected)}</p>
                          <DueBadge daysUntilNext={pattern.daysUntilNext} />
                        </TableCell>
                        <TableCell>
                          <ConfidenceBadge
                            confidence={pattern.confidence}
                            label={pattern.confidenceLabel}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                  />
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedPatternId((current) =>
                                    current === pattern.id ? null : pattern.id,
                                  );
                                }}
                              >
                                <History className="size-3.5" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {pattern.id === activePatternId
                                  ? "Hide history"
                                  : "Show history"}
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="outline"
                                  />
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openPatternTransactions(pattern);
                                }}
                              >
                                <ExternalLink className="size-3.5" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Open in Transactions
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                      {pattern.id === activePatternId ? (
                        <TableRow className="hover:bg-transparent">
                          <TableCell
                            colSpan={7}
                            className="bg-muted/20 p-0 whitespace-normal"
                          >
                            <PatternHistoryInline pattern={pattern} />
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid items-start gap-6 xl:grid-cols-1">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Upcoming recurring</CardTitle>
                <CardDescription>
                  Pattern yang diperkirakan jatuh tempo dalam waktu dekat.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingPatterns.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    Belum ada pattern recurring yang dekat dengan due date.
                  </div>
                ) : (
                  upcomingPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => openPatternTransactions(pattern)}
                      className="flex w-full flex-col items-start gap-2 rounded-lg border border-border bg-muted/20 px-3 py-3 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {pattern.merchantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {pattern.cadenceLabel} · {formatCurrency(pattern.typicalAmount)}
                          </p>
                        </div>
                        <DueBadge daysUntilNext={pattern.daysUntilNext} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeBadge type={pattern.type} />
                        <ConfidenceBadge
                          confidence={pattern.confidence}
                          label={pattern.confidenceLabel}
                        />
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Repeated exact transactions</CardTitle>
              <CardDescription>
                Deskripsi dan nominal identik yang muncul berulang. Bagian ini
                melengkapi recurring detection, tapi tidak memakai heuristik
                cadence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isHydrated || repeatedPatterns.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        {!isHydrated
                          ? "Memuat repeated transactions..."
                          : "Belum ada transaksi exact match yang berulang."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {repeatedPatterns.map((item) => (
                    <TableRow
                      key={`${item.type}-${item.amount}-${item.description}`}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => openRepeatedTransactions(item)}
                    >
                      <TableCell className="max-w-[360px] truncate">
                        {item.description}
                      </TableCell>
                      <TableCell className="capitalize">{item.type}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.count}</TableCell>
                      <TableCell>{formatDate(item.lastDate)}</TableCell>
                      <TableCell>{item.sourceFiles.length}</TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                              />
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              openRepeatedTransactions(item);
                            }}
                          >
                            <ExternalLink className="size-3.5" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Open in Transactions
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      </main>
    </TooltipProvider>
  );
}
