"use client";

import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { ExternalLink, History } from "lucide-react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { CATEGORY_COLOR_STYLES, matchTransactionCategory } from "@/lib/categories";
import {
  detectRecurringPatterns,
  type DetectedRecurringPattern,
  type RecurringConfidence,
} from "@/lib/recurring";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { buildRepeatedTransactionPatterns } from "@/lib/transaction-review";
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

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: "repeat" | "calendar" | "upload" | "download";
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

function TypeChip({ type }: { type: TransactionType }) {
  return <CupertinoChip tone={type === "credit" ? "sky" : "rose"}>{type === "credit" ? "Credit" : "Debit"}</CupertinoChip>;
}

function ConfidenceChip({
  confidence,
  label,
}: {
  confidence: RecurringConfidence;
  label: string;
}) {
  const tone =
    confidence === "high"
      ? "status-success"
      : confidence === "medium"
        ? "amber"
        : "neutral";

  return <CupertinoChip tone={tone}>{label}</CupertinoChip>;
}

function DueChip({ daysUntilNext }: { daysUntilNext: number }) {
  const tone =
    daysUntilNext < 0 ? "rose" : daysUntilNext <= 3 ? "amber" : "sky";

  return <CupertinoChip tone={tone}>{formatDueText(daysUntilNext)}</CupertinoChip>;
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
    <div className="space-y-3 bg-[#f7f7f8] dark:bg-[#2c2c2e] p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[12px] bg-white dark:bg-[#2c2c2e] px-3 py-3">
          <p className="text-[11px] font-medium text-[#8e8e93]">Occurrences</p>
          <p className="mt-2 text-[20px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
            {pattern.count}
          </p>
        </div>
        <div className="rounded-[12px] bg-white dark:bg-[#2c2c2e] px-3 py-3">
          <p className="text-[11px] font-medium text-[#8e8e93]">Average interval</p>
          <p className="mt-2 text-[20px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
            {formatInterval(pattern.averageIntervalDays)}
          </p>
        </div>
        <div className="rounded-[12px] bg-white dark:bg-[#2c2c2e] px-3 py-3">
          <p className="text-[11px] font-medium text-[#8e8e93]">Match rate</p>
          <p className="mt-2 text-[20px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
            {Math.round(pattern.matchRate * 100)}%
          </p>
        </div>
        <div className="rounded-[12px] bg-white dark:bg-[#2c2c2e] px-3 py-3">
          <p className="text-[11px] font-medium text-[#8e8e93]">Monthly effect</p>
          <p className="mt-2 text-[20px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
            {formatCurrency(Math.round(pattern.monthlyEstimate))}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-black/[0.05] dark:border-white/8 bg-white">
        <CupertinoTable
          columnsClassName="grid-cols-[110px_90px_130px_110px_170px_minmax(260px,1fr)]"
          minWidthClassName="min-w-[980px]"
          headers={[
            { key: "date", label: "Tanggal" },
            { key: "gap", label: "Gap" },
            { key: "amount", label: "Nominal" },
            { key: "source", label: "Source" },
            { key: "file", label: "Source file" },
            { key: "description", label: "Deskripsi" },
          ]}
          hasRows={pattern.transactions.length > 0}
        >
          {pattern.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className={`grid grid-cols-[110px_90px_130px_110px_170px_minmax(260px,1fr)] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
            >
              <span>{formatDate(transaction.date)}</span>
              <span>
                {transaction.intervalFromPrevious === null
                  ? "-"
                  : `${transaction.intervalFromPrevious} hari`}
              </span>
              <span className="font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                {formatCurrency(transaction.amount)}
              </span>
              <span>{transaction.bank}</span>
              <span className="truncate">{transaction.sourceFile}</span>
              <span className="truncate text-[#1c1c1e] dark:text-[#f2f2f7]">{transaction.description}</span>
            </div>
          ))}
        </CupertinoTable>
      </div>
    </div>
  );
}

export function RecurringWorkspace() {
  const router = useRouter();
  const { state, isHydrated } = useFileWorkspace();
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);

  const patterns = useMemo(() => detectRecurringPatterns(state), [state]);
  const processedTransactions = useMemo(() => {
    const fileMap = new Map(state.files.map((file) => [file.name, file]));

    return state.transactions
      .map((transaction) => ({
        ...transaction,
        bank: fileMap.get(transaction.sourceFile)?.bank ?? "Manual",
        statementPeriod: fileMap.get(transaction.sourceFile)?.statementPeriod ?? null,
        category: matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        ),
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [state.categories, state.files, state.merchantMappings, state.transactions]);

  const repeatedPatterns = useMemo(
    () => buildRepeatedTransactionPatterns(processedTransactions),
    [processedTransactions],
  );

  const filteredPatterns = patterns;

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
      description: "Pattern terdeteksi dari seluruh transaksi workspace.",
      icon: "repeat" as const,
    },
    {
      title: "Due soon",
      value: String(summary.dueSoon),
      description: "Pattern yang diperkirakan jatuh tempo dalam 7 hari.",
      icon: "calendar" as const,
    },
    {
      title: "Monthly debit estimate",
      value: formatCurrency(Math.round(summary.debitEstimate)),
      description: "Perkiraan recurring expense per bulan.",
      icon: "upload" as const,
    },
    {
      title: "Monthly credit estimate",
      value: formatCurrency(Math.round(summary.creditEstimate)),
      description: "Perkiraan recurring income per bulan.",
      icon: "download" as const,
    },
  ];

  return (
    <TooltipProvider>
      <main className="min-h-svh flex-1 bg-[#f2f2f4] dark:bg-black text-[#1c1c1e] dark:text-[#f2f2f7]">
        <section className="sticky top-[58px] z-10 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] md:top-0">
          <div className="flex w-full items-center gap-3 px-3 py-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#f2f2f7]">
              Recurring
            </h1>
          </div>
        </section>

        <div className="flex w-full flex-col gap-3 px-3 py-3">
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

          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                  Detected patterns
                </h2>
                <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                  Klik row untuk membuka transaksi serupa di halaman Transactions atau tampilkan history di bawah row.
                </p>
              </div>
              <CupertinoChip tone="neutral">
                {isHydrated ? `${filteredPatterns.length} patterns` : "Loading"}
              </CupertinoChip>
            </div>

            <CupertinoTable
              columnsClassName="grid-cols-[minmax(320px,1.6fr)_120px_150px_72px_170px_150px_96px]"
              minWidthClassName="min-w-[1240px]"
              headers={[
                { key: "merchant", label: "Merchant" },
                { key: "cadence", label: "Cadence" },
                { key: "amount", label: "Typical amount" },
                { key: "count", label: "Count" },
                { key: "next", label: "Next expected" },
                { key: "confidence", label: "Confidence" },
                { key: "actions", label: "Actions", className: "text-right" },
              ]}
              hasRows={isHydrated && filteredPatterns.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                  {!isHydrated
                    ? "Memuat recurring patterns..."
                    : "Belum ada recurring pattern yang memenuhi threshold deteksi."}
                </div>
              }
            >
              {filteredPatterns.map((pattern) => (
                <Fragment key={pattern.id}>
                  <button
                    type="button"
                    className={cn(
                      `grid w-full grid-cols-[minmax(320px,1.6fr)_120px_150px_72px_170px_150px_96px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] text-left transition hover:bg-black/[0.014] dark:hover:bg-white/5 ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`,
                      pattern.id === activePatternId ? "bg-[#007aff]/[0.05]" : "",
                    )}
                    onClick={() => openPatternTransactions(pattern)}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">
                          {pattern.merchantName}
                        </span>
                        <TypeChip type={pattern.type} />
                        {pattern.categoryName ? (
                          <span
                            className={cn(
                              "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium",
                              pattern.categoryColor
                                ? CATEGORY_COLOR_STYLES[pattern.categoryColor].badge
                                : "border-black/10 dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] text-[#636366] dark:text-[#8e8e93]",
                            )}
                          >
                            {pattern.categoryName}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-[11px] text-[#8e8e93]">
                        {pattern.descriptionSample}
                      </p>
                    </div>
                    <span className="truncate">{pattern.cadenceLabel}</span>
                    <span className="truncate font-semibold text-[#1c1c1e] dark:text-[#f2f2f7] tabular-nums">
                      {formatCurrency(pattern.typicalAmount)}
                    </span>
                    <span className="font-semibold text-[#1c1c1e] dark:text-[#f2f2f7] tabular-nums">{pattern.count}</span>
                    <div className="min-w-0 space-y-1">
                      <p className="truncate">{formatDate(pattern.nextExpected)}</p>
                      <DueChip daysUntilNext={pattern.daysUntilNext} />
                    </div>
                    <span className="min-w-0">
                      <ConfidenceChip
                        confidence={pattern.confidence}
                        label={pattern.confidenceLabel}
                      />
                    </span>
                    <div className="flex min-w-[68px] items-center justify-end gap-1.5 justify-self-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-[7px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-[#636366] dark:text-[#8e8e93] transition-colors hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2e]"
                            />
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedPatternId((current) =>
                              current === pattern.id ? null : pattern.id,
                            );
                          }}
                        >
                          <History className="size-[13px]" />
                        </TooltipTrigger>
                        <TooltipContent>
                          {pattern.id === activePatternId ? "Hide history" : "Show history"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-[7px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-[#636366] dark:text-[#8e8e93] transition-colors hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2e]"
                            />
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            openPatternTransactions(pattern);
                          }}
                        >
                          <ExternalLink className="size-[13px]" />
                        </TooltipTrigger>
                        <TooltipContent>Open in Transactions</TooltipContent>
                      </Tooltip>
                    </div>
                  </button>

                  {pattern.id === activePatternId ? (
                    <div className="border-t border-black/[0.04]">
                      <PatternHistoryInline pattern={pattern} />
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </CupertinoTable>
          </section>

          <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                  Upcoming recurring
                </h2>
                <p className="text-[11px] leading-5 text-[#8e8e93]">
                  Pattern yang diperkirakan jatuh tempo dalam waktu dekat.
                </p>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingPatterns.length === 0 ? (
                  <div className="rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] px-4 py-10 text-center text-sm text-[#8e8e93]">
                    Belum ada pattern recurring yang dekat dengan due date.
                  </div>
                ) : (
                  upcomingPatterns.map((pattern) => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => openPatternTransactions(pattern)}
                      className="flex w-full flex-col items-start gap-2 rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] px-3 py-3 text-left transition hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
                    >
                      <div className="flex w-full items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">
                            {pattern.merchantName}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-[#8e8e93]">
                            {pattern.cadenceLabel} · {formatCurrency(pattern.typicalAmount)}
                          </p>
                        </div>
                        <DueChip daysUntilNext={pattern.daysUntilNext} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <TypeChip type={pattern.type} />
                        <ConfidenceChip
                          confidence={pattern.confidence}
                          label={pattern.confidenceLabel}
                        />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
                <div className="space-y-1">
                  <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                    Repeated exact transactions
                  </h2>
                  <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                    Deskripsi dan nominal identik yang muncul berulang tanpa heuristik cadence.
                  </p>
                </div>
                <CupertinoChip tone="neutral">
                  {isHydrated ? `${repeatedPatterns.length} matches` : "Loading"}
                </CupertinoChip>
              </div>
              <CupertinoTable
                columnsClassName="grid-cols-[minmax(320px,1.5fr)_80px_130px_80px_110px_70px_70px]"
                minWidthClassName="min-w-[980px]"
                headers={[
                  { key: "description", label: "Deskripsi" },
                  { key: "type", label: "Tipe" },
                  { key: "amount", label: "Nominal" },
                  { key: "count", label: "Count" },
                  { key: "last", label: "Last seen" },
                  { key: "files", label: "Files" },
                  { key: "open", label: "Open", className: "text-right" },
                ]}
                hasRows={isHydrated && repeatedPatterns.length > 0}
                emptyState={
                  <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                    {!isHydrated
                      ? "Memuat repeated transactions..."
                      : "Belum ada transaksi exact match yang berulang."}
                  </div>
                }
              >
                {repeatedPatterns.map((item) => (
                  <button
                    key={`${item.type}-${item.amount}-${item.description}`}
                    type="button"
                    className={`grid w-full grid-cols-[minmax(320px,1.5fr)_80px_130px_80px_110px_70px_70px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] text-left transition hover:bg-black/[0.014] dark:hover:bg-white/5 ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                    onClick={() => openRepeatedTransactions(item)}
                  >
                    <span className="truncate text-[11px] text-[#1c1c1e] dark:text-[#f2f2f7]">
                      {item.description}
                    </span>
                    <span className="capitalize">{item.type}</span>
                    <span className="font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{item.count}</span>
                    <span>{formatDate(item.lastDate)}</span>
                    <span>{item.sourceFiles.length}</span>
                    <span className="flex justify-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              className="flex size-7 items-center justify-center rounded-[7px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-[#636366] dark:text-[#8e8e93] transition-colors hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2e]"
                            />
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            openRepeatedTransactions(item);
                          }}
                        >
                          <ExternalLink className="size-[13px]" />
                        </TooltipTrigger>
                        <TooltipContent>Open in Transactions</TooltipContent>
                      </Tooltip>
                    </span>
                  </button>
                ))}
              </CupertinoTable>
            </section>
          </div>
        </div>
      </main>
    </TooltipProvider>
  );
}
