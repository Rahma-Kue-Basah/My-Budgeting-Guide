"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  TransactionDetailDialog,
  type TransactionDetailDialogTransaction,
} from "@/components/transactions/transaction-detail-dialog";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/ui/summary-card";
import { WorkspaceSection } from "@/components/ui/workspace-section";
import { WorkspacePrimaryButton } from "@/components/ui/workspace-primary-button";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import {
  AddWalletTopBarButton,
  AddWalletDialog,
  useWallets,
} from "@/features/wallets/wallets";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

type DashboardTransaction = TransactionDetailDialogTransaction;

type ChartMode = "all" | "expense" | "income";
type SortColumn =
  | "date"
  | "merchant"
  | "note"
  | "createdBy"
  | "amount"
  | "category"
  | "wallet"
  ;
type SortDirection = "asc" | "desc";

const demoTransactions: DashboardTransaction[] = [
  {
    id: "tx-01",
    date: "2026-04-22",
    merchant: "Salary April",
    note: "Monthly payroll",
    category: "Income",
    wallet: "BCA",
    amount: 17500000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-02",
    date: "2026-04-22",
    merchant: "Tokopedia",
    note: "Home supplies",
    category: "Shopping",
    wallet: "BCA",
    amount: -843500,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-03",
    date: "2026-04-21",
    merchant: "Bluebird",
    note: "Office commute",
    category: "Transport",
    wallet: "Mandiri",
    amount: -128000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-04",
    date: "2026-04-20",
    merchant: "PLN",
    note: "Electricity bill",
    category: "Utilities",
    wallet: "BCA",
    amount: -614700,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-05",
    date: "2026-04-19",
    merchant: "Sushi Hiro",
    note: "Dinner",
    category: "Food",
    wallet: "Amex Gold",
    amount: -512000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-06",
    date: "2026-04-18",
    merchant: "Transfer from Raka",
    note: "Project reimbursement",
    category: "Income",
    wallet: "Chase Sapphire",
    amount: 2250000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-07",
    date: "2026-04-17",
    merchant: "Guardian",
    note: "Health essentials",
    category: "Health",
    wallet: "Mandiri",
    amount: -286000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-08",
    date: "2026-04-16",
    merchant: "Netflix",
    note: "Subscription",
    category: "Entertainment",
    wallet: "Amex Gold",
    amount: -186000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-09",
    date: "2026-04-15",
    merchant: "Starbucks",
    note: "Client meeting",
    category: "Food",
    wallet: "BCA",
    amount: -94000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-10",
    date: "2026-04-14",
    merchant: "Ace Hardware",
    note: "Repair tools",
    category: "Home",
    wallet: "BCA",
    amount: -735000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-11",
    date: "2026-04-12",
    merchant: "Mutual Fund Dividend",
    note: "Investment yield",
    category: "Income",
    wallet: "Mandiri",
    amount: 780000,
    createdBy: "Alex Rahmad",
  },
  {
    id: "tx-12",
    date: "2026-04-10",
    merchant: "Pertamina",
    note: "Fuel",
    category: "Transport",
    wallet: "BCA",
    amount: -350000,
    createdBy: "Alex Rahmad",
  },
];

const chartData = [
  { label: "Apr 8", income: 500000, expense: 320000, balance: 180000 },
  { label: "Apr 10", income: 0, expense: 510000, balance: -510000 },
  { label: "Apr 12", income: 780000, expense: 160000, balance: 620000 },
  { label: "Apr 14", income: 0, expense: 735000, balance: -735000 },
  { label: "Apr 16", income: 0, expense: 186000, balance: -186000 },
  { label: "Apr 18", income: 2250000, expense: 420000, balance: 1830000 },
  { label: "Apr 20", income: 0, expense: 614700, balance: -614700 },
  { label: "Apr 22", income: 17500000, expense: 971500, balance: 16528500 },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  if (!active) {
    return (
      <CupertinoIcon
        name="chevronDown"
        className="size-3 text-tertiary/60"
      />
    );
  }

  return (
    <CupertinoIcon
      name="chevronDown"
      className={cn(
        "size-3 text-secondary transition-transform",
        direction === "asc" ? "rotate-180" : "rotate-0",
      )}
    />
  );
}

export function TransactionsWorkspace() {
  const { state } = useFileWorkspace();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { wallets, activeWallet } = useWallets();
  const [chartMode, setChartMode] = useState<ChartMode>("all");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTx, setSelectedTx] = useState<DashboardTransaction | null>(
    null,
  );
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

  const processedFileNames = useMemo(
    () =>
      new Set(
        state.files
          .filter((file) => file.status === "processed")
          .map((file) => file.name),
      ),
    [state.files],
  );

  const importedTransactions = useMemo<DashboardTransaction[]>(() => {
    return state.transactions
      .filter((transaction) => processedFileNames.has(transaction.sourceFile))
      .map((transaction) => {
        const category = matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        );

        return {
          id: transaction.id,
          date: transaction.date,
          merchant: transaction.description,
          note: transaction.sourceFile,
          category: category?.name ?? "Uncategorized",
          wallet: transaction.sourceFile.split(".")[0] || "Imported",
          amount:
            transaction.type === "credit"
              ? transaction.amount
              : -transaction.amount,
          createdBy: "Alex Rahmad",
        };
      });
  }, [
    processedFileNames,
    state.categories,
    state.merchantMappings,
    state.transactions,
  ]);

  const transactions =
    importedTransactions.length > 0 ? importedTransactions : demoTransactions;

  const walletNames = useMemo(
    () => new Set(wallets.map((wallet) => wallet.name)),
    [wallets],
  );

  const availableTransactions = useMemo(() => {
    if (importedTransactions.length === 0) {
      return transactions;
    }

    return transactions.map((transaction, index) => ({
      ...transaction,
      wallet:
        [...walletNames][index % Math.max(walletNames.size, 1)] ??
        transaction.wallet,
    }));
  }, [importedTransactions.length, transactions, walletNames]);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return availableTransactions
      .filter((transaction) => {
        if (activeWallet !== "all" && transaction.wallet !== activeWallet) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          transaction.merchant,
          transaction.note,
          transaction.category,
          transaction.wallet,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const multiplier = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (typeof aValue === "number" && typeof bValue === "number") {
          return (aValue - bValue) * multiplier;
        }

        return String(aValue).localeCompare(String(bValue)) * multiplier;
      });
  }, [activeWallet, availableTransactions, search, sortColumn, sortDirection]);

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((transaction) => transaction.amount > 0)
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expense = filteredTransactions
      .filter((transaction) => transaction.amount < 0)
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);

    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortColumn(column);
    setSortDirection("asc");
  }

  const summaryCards = [
    {
      label: "Total Income",
      value: formatCurrency(totals.income),
      valueClassName: "text-success",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totals.expense),
      valueClassName: "text-danger",
    },
    {
      label: "Net",
      value: `${totals.net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(totals.net))}`,
      valueClassName: totals.net >= 0 ? "text-success" : "text-danger",
    },
    {
      label: "Transactions",
      value: String(totals.count),
      valueClassName: "text-primary",
    },
  ];

  return (
    <main className="min-h-svh w-full overflow-x-hidden bg-app text-primary">
      <WorkspaceTopBar
        title="Transactions"
        variant="fixed"
        actions={
          <AddWalletTopBarButton
            onClick={() => setIsWalletDialogOpen(true)}
          />
        }
      />

      <div className="flex w-full flex-col gap-4 px-3 pt-[60px] pb-4">
        <section>
          <div className="flex min-w-0 flex-col gap-3">
            <section>
              <WorkspaceSection as="div">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold">
                      Daily Activity
                    </h2>
                    <p className="mt-0.5 text-[11px] text-tertiary">
                      Apr 8 - Apr 22
                    </p>
                  </div>
                  <div className="shrink-0 overflow-x-auto">
                    <div className="flex rounded-[8px] bg-surface-muted p-0.5">
                      {[
                        ["all", "All"],
                        ["expense", "Expenses"],
                        ["income", "Income"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          className={cn(
                            "shrink-0 rounded-[6px] px-3 py-1 text-[11px] font-medium transition",
                            chartMode === key
                              ? "border border-subtle bg-surface text-primary dark:bg-surface-raised"
                              : "text-tertiary",
                          )}
                          onClick={() => setChartMode(key as ChartMode)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-2 flex items-center gap-4 text-[11px] text-tertiary">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-danger" />
                    Expenses
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-accent" />
                    Income
                  </span>
                </div>
                <div className="h-[210px] w-full">
                  {isClient ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={1}
                      minHeight={1}
                    >
                      <AreaChart
                        data={chartData}
                        margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="transactions-expense-fill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--danger)"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--danger)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient
                            id="transactions-income-fill"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--accent)"
                              stopOpacity={0.18}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--accent)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          stroke="rgba(0,0,0,0.06)"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{
                            fontSize: 10,
                            fill: "var(--text-tertiary)",
                          }}
                        />
                        <YAxis hide domain={["auto", "auto"]} />
                        <RechartsTooltip
                          formatter={(value) =>
                            typeof value === "number"
                              ? formatCurrency(Math.abs(value))
                              : "-"
                          }
                          contentStyle={{
                            border: "1px solid rgba(0,0,0,0.08)",
                            borderRadius: 10,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                            fontSize: 12,
                          }}
                        />
                        {chartMode === "all" ? (
                          <>
                            <Area
                              type="basis"
                              dataKey="expense"
                              stroke="var(--danger)"
                              strokeWidth={3}
                              fill="url(#transactions-expense-fill)"
                              fillOpacity={1}
                              dot={false}
                              activeDot={{
                                r: 4,
                                strokeWidth: 2,
                                stroke: "var(--surface)",
                              }}
                            />
                            <Area
                              type="basis"
                              dataKey="income"
                              stroke="var(--accent)"
                              strokeWidth={3}
                              fill="url(#transactions-income-fill)"
                              fillOpacity={1}
                              dot={false}
                              activeDot={{
                                r: 4,
                                strokeWidth: 2,
                                stroke: "var(--surface)",
                              }}
                            />
                          </>
                        ) : (
                          <Area
                            type="basis"
                            dataKey={chartMode}
                            stroke={
                              chartMode === "income"
                                ? "var(--accent)"
                                : chartMode === "expense"
                                  ? "var(--danger)"
                                  : "var(--accent)"
                            }
                            strokeWidth={3}
                            fill={
                              chartMode === "income"
                                ? "url(#transactions-income-fill)"
                                : "url(#transactions-expense-fill)"
                            }
                            fillOpacity={1}
                            dot={false}
                            activeDot={{
                              r: 4,
                              strokeWidth: 2,
                              stroke: "var(--surface)",
                            }}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-[10px] bg-surface-muted" />
                  )}
                </div>
              </WorkspaceSection>
            </section>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard
                  key={card.label}
                  title={card.label}
                  value={card.value}
                  className="px-[18px] py-4"
                  valueClassName={cn(
                    "truncate text-2xl font-bold tracking-tight",
                    card.valueClassName,
                  )}
                />
              ))}
            </section>

            <section className="overflow-hidden rounded-[20px] border border-subtle bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
              <div className="flex flex-col gap-3 border-b border-subtle px-[18px] py-3.5 xl:flex-row xl:flex-wrap xl:items-center">
                <div>
                  <h2 className="text-[13px] font-semibold">Transactions</h2>
                  <p className="mt-0.5 text-[11px] text-tertiary">
                    Search, sort, and review transaction activity
                  </p>
                </div>

                <div className="flex items-center gap-2 xl:ml-auto">
                  <div className="flex flex-1 min-w-0 items-center gap-2 rounded-[8px] border border-strong bg-surface-muted px-2.5 py-1.5">
                    <CupertinoIcon
                      name="search"
                      className="size-3.5 shrink-0 text-tertiary"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search..."
                      className="min-w-0 flex-1 border-0 bg-transparent text-xs outline-none placeholder:text-tertiary"
                    />
                  </div>
                  <WorkspacePrimaryButton size="sm">
                    <CupertinoIcon name="plus" className="size-3.5" />
                    Add
                  </WorkspacePrimaryButton>
                  <Button
                    variant="outline"
                    className="h-8 rounded-[8px] border-strong bg-surface-muted px-3 shadow-none"
                    render={<Link href="/file" />}
                  >
                    <CupertinoIcon name="upload" className="size-3.5" />
                    Import
                  </Button>
                </div>
              </div>
              <CupertinoTable
                columnsClassName="grid-cols-[78px_minmax(0,1.2fr)_minmax(0,1fr)_120px_130px_120px_110px_40px]"
                minWidthClassName="min-w-[1020px]"
                bodyClassName="max-h-[calc(100vh-420px)] min-h-[260px] overflow-y-auto"
                headers={[
                  {
                    key: "date",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("date")}
                      >
                        Date
                        <SortIndicator
                          active={sortColumn === "date"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "merchant",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("merchant")}
                      >
                        Merchant
                        <SortIndicator
                          active={sortColumn === "merchant"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "note",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("note")}
                      >
                        Note
                        <SortIndicator
                          active={sortColumn === "note"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "amount",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("amount")}
                      >
                        Amount
                        <SortIndicator
                          active={sortColumn === "amount"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "category",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("category")}
                      >
                        Category
                        <SortIndicator
                          active={sortColumn === "category"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "wallet",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("wallet")}
                      >
                        Wallet
                        <SortIndicator
                          active={sortColumn === "wallet"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  {
                    key: "createdBy",
                    label: (
                      <button
                        type="button"
                        className="flex items-center gap-1 text-left"
                        onClick={() => toggleSort("createdBy")}
                      >
                        Created by
                        <SortIndicator
                          active={sortColumn === "createdBy"}
                          direction={sortDirection}
                        />
                      </button>
                    ),
                  },
                  { key: "open", label: "" },
                ]}
                hasRows={filteredTransactions.length > 0}
                emptyState={
                  <div className="px-5 py-14 text-center text-sm text-tertiary">
                    No transactions found
                  </div>
                }
              >
                {filteredTransactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    className={cn(
                      "grid w-full grid-cols-[78px_minmax(0,1.2fr)_minmax(0,1fr)_120px_130px_120px_110px_40px] items-center gap-3 px-[18px] text-left transition hover:bg-surface-muted",
                      CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
                    )}
                    onClick={() => setSelectedTx(transaction)}
                  >
                    <span className="text-[11px] text-tertiary">
                      {formatDate(transaction.date).replace(" 2026", "")}
                    </span>
                    <span className="min-w-0 pr-3">
                      <span className="block truncate text-xs font-medium">
                        {transaction.merchant}
                      </span>
                    </span>
                    <span className="truncate pr-2 text-[11px] text-secondary">
                      {transaction.note || "No note"}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        transaction.amount > 0
                          ? "text-success"
                          : "text-primary",
                      )}
                    >
                      {transaction.amount > 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    <span className="truncate pr-2 text-[11px] text-secondary">
                      {transaction.category}
                    </span>
                    <span className="truncate pr-2 text-[11px] text-secondary">
                      {transaction.wallet}
                    </span>
                    <span className="flex items-center gap-2 pr-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[10px] font-semibold text-primary">
                        {getInitials(transaction.createdBy)}
                      </span>
                      <span className="truncate text-[11px] text-secondary">
                        {transaction.createdBy}
                      </span>
                    </span>
                    <span className="flex justify-center">
                      <CupertinoIcon
                        name="more"
                        className="size-4 text-tertiary"
                      />
                    </span>
                  </button>
                ))}
              </CupertinoTable>
            </section>
          </div>
        </section>
      </div>

      <TransactionDetailDialog
        transaction={selectedTx}
        open={selectedTx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
          }
        }}
        showHistoryChart
      />

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
      />
    </main>
  );
}
