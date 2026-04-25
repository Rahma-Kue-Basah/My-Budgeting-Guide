"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  CollapsibleFilterPanel,
  FILTER_INPUT_CLASS_NAME,
  FilterPanelActions,
  FilterPanelField,
  FilterPanelGrid,
} from "@/components/filters/collapsible-filter-panel";
import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { Input } from "@/components/ui/input";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type {
  ParsedTransaction,
  TransactionType,
  WorkspaceCategory,
} from "@/types/transaction";

type EnrichedTransaction = ParsedTransaction & {
  bank: string;
  statementPeriod: string | null;
  category: WorkspaceCategory | null;
  sourceLabel: string;
  sourceKind: "import" | "manual";
};

type TransactionFilterState = {
  search: string;
  type: "all" | TransactionType;
  bank: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
  transactionId: string;
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
  icon: "database" | "download" | "upload";
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
      <p className="mt-3 text-[11px] leading-5 text-tertiary">{description}</p>
    </div>
  );
}

function CategoryChip({
  category,
}: {
  category: WorkspaceCategory | null;
}) {
  if (!category) {
    return <span className="text-[11px] text-tertiary">Uncategorized</span>;
  }

  return <CupertinoChip tone={category.color}>{category.name}</CupertinoChip>;
}

function TypeChip({ type }: { type: TransactionType }) {
  return (
    <CupertinoChip tone={type === "credit" ? "sky" : "rose"}>
      {type === "credit" ? "Credit" : "Debit"}
    </CupertinoChip>
  );
}

export function TransactionsWorkspace() {
  const searchParams = useSearchParams();
  const searchParamType = searchParams?.get("type");
  const normalizedType =
    searchParamType === "debit" || searchParamType === "credit"
      ? searchParamType
      : "all";
  const initialFilters = useMemo<TransactionFilterState>(
    () => ({
      search: searchParams?.get("search") ?? "",
      type: normalizedType,
      bank: searchParams?.get("bank") ?? "all",
      category: searchParams?.get("category") ?? "all",
      dateFrom: searchParams?.get("date_from") ?? "",
      dateTo: searchParams?.get("date_to") ?? "",
      amountMin: searchParams?.get("amount_min") ?? "",
      amountMax: searchParams?.get("amount_max") ?? "",
      transactionId: searchParams?.get("transaction_id") ?? "",
    }),
    [normalizedType, searchParams],
  );

  return (
    <TransactionsWorkspaceContent
      key={searchParams?.toString() ?? ""}
      initialFilters={initialFilters}
    />
  );
}

function TransactionsWorkspaceContent({
  initialFilters,
}: {
  initialFilters: TransactionFilterState;
}) {
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState(initialFilters.search);
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>(
    initialFilters.type,
  );
  const [bankFilter, setBankFilter] = useState(initialFilters.bank);
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category);
  const [dateFrom, setDateFrom] = useState(initialFilters.dateFrom);
  const [dateTo, setDateTo] = useState(initialFilters.dateTo);
  const [amountMin, setAmountMin] = useState(initialFilters.amountMin);
  const [amountMax, setAmountMax] = useState(initialFilters.amountMax);
  const [transactionIdFilter, setTransactionIdFilter] = useState(
    initialFilters.transactionId,
  );

  const fileMap = useMemo(
    () => new Map(state.files.map((file) => [file.name, file])),
    [state.files],
  );

  const transactions = useMemo<EnrichedTransaction[]>(() => {
    return state.transactions
      .map((transaction) => {
        const file = fileMap.get(transaction.sourceFile) ?? null;

        return {
          ...transaction,
          bank: file?.bank ?? "Manual",
          statementPeriod: file?.statementPeriod ?? null,
          sourceLabel: file ? transaction.sourceFile : "Manual entry",
          sourceKind: file ? ("import" as const) : ("manual" as const),
          category: matchTransactionCategory(
            transaction,
            state.categories,
            state.merchantMappings,
          ),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [fileMap, state.categories, state.merchantMappings, state.transactions]);

  const bankOptions = useMemo(() => {
    return [...new Set(transactions.map((transaction) => transaction.bank))].sort();
  }, [transactions]);

  const typeOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  const bankFilterOptions = [
    { value: "all", label: "Semua source" },
    ...bankOptions.map((bank) => ({
      value: bank,
      label: bank,
      leadingLabel: bank.slice(0, 2).toUpperCase(),
      leadingColor: bank === "Manual" ? "var(--text-primary)" : "var(--accent)",
    })),
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

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const query = search.trim().toLowerCase();
      const dateValue = transaction.date.slice(0, 10);
      const min = amountMin.trim() ? Number(amountMin) : null;
      const max = amountMax.trim() ? Number(amountMax) : null;

      if (transactionIdFilter && transaction.id !== transactionIdFilter) {
        return false;
      }

      if (
        query &&
        !`${transaction.description} ${transaction.sourceLabel} ${transaction.bank}`
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

      if (dateFrom && dateValue < dateFrom) {
        return false;
      }

      if (dateTo && dateValue > dateTo) {
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
  }, [
    amountMax,
    amountMin,
    bankFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    search,
    transactionIdFilter,
    transactions,
    typeFilter,
  ]);

  const filteredSummary = useMemo(() => {
    let creditTotal = 0;
    let debitTotal = 0;

    for (const transaction of filteredTransactions) {
      if (transaction.type === "credit") {
        creditTotal += transaction.amount;
      } else {
        debitTotal += transaction.amount;
      }
    }

    return {
      total: filteredTransactions.length,
      creditTotal,
      debitTotal,
    };
  }, [filteredTransactions]);

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    setTransactionIdFilter("");
  }

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar title="Transactions" />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            title="Total transactions"
            value={filteredSummary.total}
            description="Jumlah transaksi yang cocok dengan filter saat ini, termasuk import dan manual entry."
            icon="database"
          />
          <SummaryCard
            title="Total credit"
            value={formatCurrency(filteredSummary.creditTotal)}
            description="Akumulasi transaksi credit dari hasil filter saat ini."
            icon="download"
          />
          <SummaryCard
            title="Total debit"
            value={formatCurrency(filteredSummary.debitTotal)}
            description="Akumulasi transaksi debit dari hasil filter saat ini."
            icon="upload"
          />
        </section>

        <CollapsibleFilterPanel
          title="Transaction filters"
          description="Saring transaksi berdasarkan keyword, tipe, source, kategori, tanggal, dan rentang nominal."
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
                  placeholder="Cari deskripsi, source, atau bank"
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
                ariaLabel="Filter transaction type"
              />
            </FilterPanelField>
            <FilterPanelField label="Source">
              <CupertinoSelect
                icon="wallet"
                value={bankFilter}
                onChange={setBankFilter}
                options={bankFilterOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter transaction source"
              />
            </FilterPanelField>
            <FilterPanelField label="Category">
              <CupertinoSelect
                icon="tag"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryFilterOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter transaction category"
              />
            </FilterPanelField>
          </FilterPanelGrid>

          <FilterPanelGrid className="mt-3">
            <FilterPanelField label="Date from">
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className={FILTER_INPUT_CLASS_NAME}
              />
            </FilterPanelField>
            <FilterPanelField label="Date to">
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className={FILTER_INPUT_CLASS_NAME}
              />
            </FilterPanelField>
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
          </FilterPanelGrid>

          <FilterPanelActions className="mt-3">
            {transactionIdFilter ? (
              <span className="inline-flex h-5 items-center justify-center rounded-full border border-subtle bg-surface-muted px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-secondary">
                Focused transaction
              </span>
            ) : null}
            <Button
              variant="outline"
              className="h-9 rounded-[9px] border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              onClick={resetFilters}
            >
              Reset filters
            </Button>
          </FilterPanelActions>
        </CollapsibleFilterPanel>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Transaction table
              </h2>
              <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                Menampilkan seluruh transaksi workspace dari semua sumber yang aktif.
              </p>
            </div>
            <span className="inline-flex h-5 items-center justify-center rounded-full border border-subtle bg-surface-muted px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-secondary">
              {isHydrated ? `${filteredTransactions.length} rows` : "Loading"}
            </span>
          </div>

          <CupertinoTable
            columnsClassName="grid-cols-[110px_minmax(0,1.35fr)_150px_90px_120px_120px_100px_160px]"
            minWidthClassName="min-w-[1120px]"
            headers={[
              { key: "date", label: "Tanggal" },
              { key: "description", label: "Deskripsi" },
              { key: "category", label: "Category" },
              { key: "type", label: "Type" },
              { key: "amount", label: "Nominal" },
              { key: "balance", label: "Saldo" },
              { key: "source", label: "Source" },
              { key: "origin", label: "Origin" },
            ]}
            hasRows={isHydrated && filteredTransactions.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat transaksi workspace..."
                  : "Belum ada transaksi yang cocok dengan filter saat ini."}
              </div>
            }
          >
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`grid grid-cols-[110px_minmax(0,1.35fr)_150px_90px_120px_120px_100px_160px] items-center gap-3 px-[18px] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
              >
                <span className="text-[11px] text-secondary">
                  {formatDate(transaction.date)}
                </span>
                <span className="truncate text-sm text-primary">
                  {transaction.description}
                </span>
                <span>
                  <CategoryChip category={transaction.category} />
                </span>
                <span>
                  <TypeChip type={transaction.type} />
                </span>
                <span className="text-sm font-semibold text-primary">
                  {formatCurrency(transaction.amount)}
                </span>
                <span className="text-sm text-secondary">
                  {formatCurrency(transaction.balance)}
                </span>
                <span>
                  <CupertinoChip
                    tone={transaction.sourceKind === "manual" ? "neutral" : "bank"}
                  >
                    {transaction.bank}
                  </CupertinoChip>
                </span>
                <span className="truncate text-[11px] text-secondary">
                  {transaction.sourceLabel}
                </span>
              </div>
            ))}
          </CupertinoTable>
        </section>
      </div>
    </main>
  );
}
