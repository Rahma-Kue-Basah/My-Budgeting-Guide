"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AmountDistributionCard,
  type AmountDistributionRange,
} from "@/components/charts/amount-distribution-card";
import {
  CollapsibleFilterPanel,
  FILTER_INPUT_CLASS_NAME,
  FilterPanelField,
  FilterPanelGrid,
} from "@/components/filters/collapsible-filter-panel";
import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
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

function SummaryCard({
  title,
  value,
  note,
  icon,
}: {
  title: string;
  value: string | number;
  note: string;
  icon: "alert" | "tag" | "search";
}) {
  return (
    <div className="rounded-[13px] border-0 bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.02em] text-tertiary">
            {title}
          </p>
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-primary">
            {value}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-surface-raised">
          <CupertinoIcon name={icon} className="size-4 text-secondary" />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-tertiary">{note}</p>
    </div>
  );
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
      icon: "alert" as const,
    },
    {
      title: "Off-category",
      value: String(filteredCategoryAlerts.length),
      note: "Tidak wajar dibanding kategori yang sama",
      icon: "tag" as const,
    },
    {
      title: "Possible duplicate",
      value: String(filteredSameDayClusters.length),
      note: "Transaksi identik di hari yang sama",
      icon: "search" as const,
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
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar title="Anomalies" />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((item) => (
            <SummaryCard
              key={item.title}
              title={item.title}
              value={item.value}
              note={item.note}
              icon={item.icon}
            />
          ))}
        </section>

        <CollapsibleFilterPanel
          title="Alert filters"
          description="Saring anomali berdasarkan source, kategori, tipe transaksi, dan rentang nominal."
        >
          <FilterPanelGrid>
            <FilterPanelField label="Search">
              <div className="relative">
                <CupertinoIcon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-tertiary"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari deskripsi, source, atau kategori"
                  className={`${FILTER_INPUT_CLASS_NAME} pl-9`}
                />
              </div>
            </FilterPanelField>
            <FilterPanelField label="Type">
              <CupertinoSelect
                icon="repeat"
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as "all" | TransactionType)}
                options={typeOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter anomaly transaction type"
              />
            </FilterPanelField>
            <FilterPanelField label="Source">
              <CupertinoSelect
                icon="wallet"
                value={bankFilter}
                onChange={setBankFilter}
                options={bankFilterOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter anomaly source"
              />
            </FilterPanelField>
            <FilterPanelField label="Category">
              <CupertinoSelect
                icon="tag"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryFilterOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter anomaly category"
              />
            </FilterPanelField>
          </FilterPanelGrid>

          <FilterPanelGrid className="mt-3">
            <FilterPanelField label="Minimum amount">
              <Input
                inputMode="numeric"
                placeholder="Nominal minimum"
                value={amountMin}
                onChange={(event) => setAmountMin(event.target.value)}
                className={FILTER_INPUT_CLASS_NAME}
              />
            </FilterPanelField>
            <FilterPanelField label="Maximum amount">
              <Input
                inputMode="numeric"
                placeholder="Nominal maksimum"
                value={amountMax}
                onChange={(event) => setAmountMax(event.target.value)}
                className={FILTER_INPUT_CLASS_NAME}
              />
            </FilterPanelField>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={resetFilters}
                className="h-10 rounded-[10px] border-subtle bg-surface-muted px-3 text-primary shadow-none hover:bg-surface-raised"
              >
                Reset filters
              </Button>
            </div>
          </FilterPanelGrid>
        </CollapsibleFilterPanel>

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

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="space-y-1 px-[18px] pt-[18px] pb-3">
            <h2 className="text-[13px] font-semibold text-primary">
              Possible duplicate
            </h2>
            <p className="text-[11px] leading-5 text-tertiary">
              Transaksi identik di hari yang sama yang layak dicek ulang.
            </p>
          </div>
          <CupertinoTable
            columnsClassName="grid-cols-[110px_minmax(0,1fr)_90px_140px_90px]"
            minWidthClassName="min-w-[900px]"
            headers={[
              { key: "date", label: "Tanggal" },
              { key: "description", label: "Deskripsi" },
              { key: "type", label: "Tipe" },
              { key: "amount", label: "Nominal" },
              { key: "count", label: "Count" },
            ]}
            hasRows={isHydrated && filteredSameDayClusters.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat potensi duplikasi..."
                  : "Belum ada cluster transaksi yang mencurigakan."}
              </div>
            }
          >
            {filteredSameDayClusters.map((item) => (
                  <button
                    key={`${item.date}-${item.type}-${item.amount}-${item.description}`}
                    className={`grid w-full grid-cols-[110px_minmax(0,1fr)_90px_140px_90px] items-center gap-3 px-[18px] text-[11px] text-secondary text-left transition hover:bg-surface-muted ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
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
                    <span className="text-[11px] text-secondary">{formatDate(item.date)}</span>
                    <span className="truncate text-[11px] text-primary">
                      {item.description}
                    </span>
                    <span className="capitalize text-[11px] text-secondary">{item.type}</span>
                    <span className="text-[11px] font-semibold text-primary">{formatCurrency(item.amount)}</span>
                    <span className="text-[11px] font-semibold text-primary">{item.count}</span>
                  </button>
                ))}
          </CupertinoTable>
        </section>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="space-y-1 px-[18px] pt-[18px] pb-3">
            <h2 className="text-[13px] font-semibold text-primary">
              Large amount alerts
            </h2>
            <p className="text-[11px] leading-5 text-tertiary">
              Transaksi yang jauh lebih besar dari pola nominal umum.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <CupertinoChip tone="neutral">
                Mean {formatCurrency(Math.round(anomalyStats.mean))}
              </CupertinoChip>
              <CupertinoChip tone="neutral">
                IQR upper {formatCurrency(Math.round(anomalyStats.iqrUpper))}
              </CupertinoChip>
            </div>
          </div>
          <CupertinoTable
            columnsClassName="grid-cols-[110px_minmax(0,1.3fr)_150px_minmax(220px,1fr)_130px_90px_140px]"
            minWidthClassName="min-w-[1220px]"
            headers={[
              { key: "date", label: "Tanggal" },
              { key: "description", label: "Deskripsi" },
              { key: "category", label: "Category" },
              { key: "flagged", label: "Why flagged" },
              { key: "mean", label: "Vs mean" },
              { key: "type", label: "Tipe" },
              { key: "amount", label: "Nominal" },
            ]}
            hasRows={isHydrated && filteredAmountOutliers.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat alert nominal besar..."
                  : "Belum ada transaksi yang melewati threshold nominal besar."}
              </div>
            }
          >
            {filteredAmountOutliers.map((transaction) => (
                  <button
                    key={transaction.id}
                    className={`grid w-full grid-cols-[110px_minmax(0,1.3fr)_150px_minmax(220px,1fr)_130px_90px_140px] items-center gap-3 px-[18px] text-[11px] text-secondary text-left transition hover:bg-surface-muted ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                    onClick={() =>
                      router.push(
                        buildTransactionsHref({
                          transaction_id: transaction.id,
                        }),
                      )
                    }
                  >
                    <span className="text-[11px] text-secondary">{formatDate(transaction.date)}</span>
                    <span className="truncate text-[11px] text-primary">
                      {transaction.description}
                    </span>
                    <span>
                      {transaction.category ? (
                        <span
                          className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium ${CATEGORY_COLOR_STYLES[transaction.category.color].badge}`}
                        >
                          {transaction.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-tertiary">-</span>
                      )}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {transaction.anomalyBasis}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {formatDeltaCurrency(transaction.amount - anomalyStats.mean)}
                    </span>
                    <span className="capitalize text-[11px] text-secondary">{transaction.type}</span>
                    <span className="text-[11px] font-semibold text-primary">{formatCurrency(transaction.amount)}</span>
                  </button>
                ))}
          </CupertinoTable>
        </section>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="space-y-1 px-[18px] pt-[18px] pb-3">
            <h2 className="text-[13px] font-semibold text-primary">
              Off-category alerts
            </h2>
            <p className="text-[11px] leading-5 text-tertiary">
              Transaksi yang nominalnya jauh di atas pola kategori yang sama.
            </p>
          </div>
          <CupertinoTable
            columnsClassName="grid-cols-[110px_minmax(0,1.4fr)_150px_150px_150px_140px]"
            minWidthClassName="min-w-[1140px]"
            headers={[
              { key: "date", label: "Tanggal" },
              { key: "description", label: "Deskripsi" },
              { key: "category", label: "Category" },
              { key: "typical", label: "Typical amount" },
              { key: "difference", label: "Difference" },
              { key: "amount", label: "Nominal" },
            ]}
            hasRows={isHydrated && filteredCategoryAlerts.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat alert per kategori..."
                  : "Belum ada transaksi yang terlihat menyimpang dalam kategorinya."}
              </div>
            }
          >
            {filteredCategoryAlerts.map((transaction) => (
                  <button
                    key={`${transaction.id}-category-alert`}
                    className={`grid w-full grid-cols-[110px_minmax(0,1.4fr)_150px_150px_150px_140px] items-center gap-3 px-[18px] text-[11px] text-secondary text-left transition hover:bg-surface-muted ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                    onClick={() =>
                      router.push(
                        buildTransactionsHref({
                          transaction_id: transaction.id,
                        }),
                      )
                    }
                  >
                    <span className="text-[11px] text-secondary">{formatDate(transaction.date)}</span>
                    <span className="truncate text-[11px] text-primary">
                      {transaction.description}
                    </span>
                    <span>
                      <span
                        className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium ${
                          transaction.category
                            ? CATEGORY_COLOR_STYLES[transaction.category.color].badge
                            : ""
                        }`}
                      >
                        {transaction.category?.name ?? "-"}
                      </span>
                    </span>
                    <span className="text-[11px] text-secondary">
                      {formatCurrency(Math.round(transaction.categoryMean))}
                    </span>
                    <span className="text-[11px] text-secondary">
                      {formatDeltaCurrency(
                        transaction.amount - transaction.categoryMean,
                      )}
                    </span>
                    <span className="text-[11px] font-semibold text-primary">{formatCurrency(transaction.amount)}</span>
                  </button>
                ))}
          </CupertinoTable>
        </section>
      </div>
    </main>
  );
}
