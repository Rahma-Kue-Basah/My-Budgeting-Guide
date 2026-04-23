"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { FilterCard } from "@/components/filters/filter-card";
import { FilterDropdown } from "@/components/filters/filter-dropdown";
import {
  CATEGORY_COLOR_STYLES,
  matchTransactionCategory,
} from "@/lib/categories";
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
import { formatCurrency, formatDate } from "@/lib/formatters";
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
import type {
  ParsedTransaction,
  TransactionType,
  WorkspaceCategory,
} from "@/types/transaction";

type EnrichedTransaction = ParsedTransaction & {
  bank: string;
  statementPeriod: string | null;
  category: WorkspaceCategory | null;
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

  const processedFiles = useMemo(
    () => state.files.filter((file) => file.status === "processed"),
    [state.files],
  );
  const fileMap = useMemo(
    () => new Map(processedFiles.map((file) => [file.name, file])),
    [processedFiles],
  );

  const transactions = useMemo<EnrichedTransaction[]>(() => {
    return state.transactions
      .map((transaction) => {
        const file = fileMap.get(transaction.sourceFile);

        if (!file) {
          return null;
        }

        return {
          ...transaction,
          bank: file.bank,
          statementPeriod: file.statementPeriod ?? null,
          category: matchTransactionCategory(
            transaction,
            state.categories,
            state.merchantMappings,
          ),
        };
      })
      .filter((transaction): transaction is EnrichedTransaction =>
        Boolean(transaction),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [fileMap, state.categories, state.merchantMappings, state.transactions]);

  const bankOptions = useMemo(() => {
    return [...new Set(processedFiles.map((file) => file.bank))].sort();
  }, [processedFiles]);

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
                <BreadcrumbPage>Transactions</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Transactions
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Tabel gabungan transaksi dari file yang sudah berstatus processed,
              lengkap dengan filter untuk meninjau data lintas file dan bank.
            </p>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-3">
          <Card className="border-indigo-200/80 bg-indigo-400/40 dark:border-indigo-900/70 dark:bg-indigo-400/40">
            <CardHeader>
              <CardDescription>Total transactions</CardDescription>
              <CardTitle className="text-2xl">
                {filteredSummary.total}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-emerald-200/80 bg-emerald-400/40 dark:border-emerald-900/70 dark:bg-emerald-400/40">
            <CardHeader>
              <CardDescription>Total credit</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(filteredSummary.creditTotal)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-rose-200/80 bg-rose-400/40 dark:border-rose-900/70 ">
            <CardHeader>
              <CardDescription>Total debit</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(filteredSummary.debitTotal)}
              </CardTitle>
            </CardHeader>
          </Card>
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
                    placeholder="Cari deskripsi, file asal, atau bank"
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
                  Date from
                </label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="border-border bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Date to
                </label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="border-border bg-background"
                />
              </div>
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
              {transactionIdFilter ? (
                <Badge variant="outline">Focused transaction</Badge>
              ) : null}
              <Button variant="outline" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
        </FilterCard>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Combined transactions table</CardTitle>
            <CardDescription>
              Menampilkan data transaksi dari semua file yang tersimpan di
              workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>File asal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat transaksi workspace..."
                        : "Belum ada transaksi yang cocok dengan filter saat ini."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
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
                    <TableCell>
                      <TypeBadge type={transaction.type} />
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatCurrency(transaction.balance)}</TableCell>
                    <TableCell>{transaction.bank}</TableCell>
                    <TableCell className="max-w-[240px] truncate">
                      {transaction.sourceFile}
                    </TableCell>
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
