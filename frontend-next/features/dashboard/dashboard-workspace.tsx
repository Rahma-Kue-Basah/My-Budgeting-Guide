"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SummaryCard } from "@/components/ui/summary-card";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import { WorkspaceTopBarActionButton } from "@/components/ui/workspace-top-bar-action-button";
import {
  AddWalletDialog,
  WalletSelect,
  useWallets,
} from "@/features/wallets/wallets";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";

type DashboardTransaction = TransactionDetailDialogTransaction;

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

const overviewCashFlowData = [
  { month: "Oct", income: 3800000, expenses: 2950000 },
  { month: "Nov", income: 4100000, expenses: 3180000 },
  { month: "Dec", income: 4600000, expenses: 3520000 },
  { month: "Jan", income: 4300000, expenses: 3360000 },
  { month: "Feb", income: 4920000, expenses: 3740000 },
  { month: "Mar", income: 5050000, expenses: 4210000 },
  { month: "Apr", income: 5250000, expenses: 3990000 },
];

const overviewBudgetCategories = [
  { name: "Housing", spent: "Rp 2.500", limit: "Rp 2.500", percent: 100 },
  { name: "Groceries", spent: "Rp 412", limit: "Rp 600", percent: 69 },
  {
    name: "Dining",
    spent: "Rp 531",
    limit: "Rp 400",
    percent: 100,
    over: true,
  },
  { name: "Transportation", spent: "Rp 188", limit: "Rp 300", percent: 63 },
  { name: "Subscriptions", spent: "Rp 96", limit: "Rp 120", percent: 80 },
  { name: "Fitness", spent: "Rp 68", limit: "Rp 100", percent: 68 },
];

const overviewMerchants = [
  { icon: "🛒", name: "Whole Foods", amount: "Rp 412", change: "+8%" },
  { icon: "📦", name: "Amazon", amount: "Rp 318", change: "+22%" },
  { icon: "🍔", name: "Uber Eats", amount: "Rp 247", change: "+41%" },
  { icon: "⛽", name: "Shell", amount: "Rp 188", change: "-3%" },
];

const overviewAlerts = [
  {
    type: "danger",
    marker: "↑",
    title: "Dining overspent by Rp 131.000",
    description: "Rp 531.000 vs Rp 400.000 budget",
  },
  {
    type: "info",
    marker: "?",
    title: "7 uncategorized transactions",
    description: "from last 3 days",
  },
  {
    type: "warning",
    marker: "!",
    title: "Unusual spend: Amazon Rp 127.000",
    description: "3x your average",
  },
];

const overviewQuickActions = [
  { title: "Import Transactions", href: "/file", icon: "upload" as const },
  { title: "Add Transaction", href: "/transactions", icon: "plus" as const },
  { title: "Review Categories", href: "/categories", icon: "tag" as const },
  { title: "Create Budget Plan", href: "/budgeting", icon: "receipt" as const },
];

const overallBudgetUsage = [
  { name: "Used", value: 78, color: "var(--warning)" },
  { name: "Left", value: 22, color: "var(--bg-surface-muted)" },
];

function getBudgetBarColor(percent: number, over?: boolean): string {
  if (over || percent >= 100) return "var(--danger)";
  if (percent >= 80) return "var(--warning)";
  return "var(--success)";
}

function getTrendTone(change: number | null, invert = false): string {
  if (change === null || change === 0) return "text-primary";

  const isPositive = change > 0;
  const isGood = invert ? !isPositive : isPositive;

  return isGood ? "text-success" : "text-danger";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function DashboardOverview({
  isClient,
  recentTransactions,
  wallets,
  onSelectTransaction,
}: {
  isClient: boolean;
  recentTransactions: DashboardTransaction[];
  wallets: ReturnType<typeof useWallets>["wallets"];
  onSelectTransaction: (transaction: DashboardTransaction) => void;
}) {
  const currentCashFlow = overviewCashFlowData.at(-1);
  const previousCashFlow = overviewCashFlowData.at(-2);

  const incomeChange =
    currentCashFlow && previousCashFlow && previousCashFlow.income > 0
      ? ((currentCashFlow.income - previousCashFlow.income) /
          previousCashFlow.income) *
        100
      : null;

  const currentRemaining = currentCashFlow
    ? currentCashFlow.income - currentCashFlow.expenses
    : null;
  const previousRemaining = previousCashFlow
    ? previousCashFlow.income - previousCashFlow.expenses
    : null;

  const remainingChange =
    currentRemaining !== null && previousRemaining && previousRemaining > 0
      ? ((currentRemaining - previousRemaining) / previousRemaining) * 100
      : null;

  const summaryCards = [
    {
      label: "Total Balance",
      value: "Rp 28.416.000",
      detail: "vs last month",
      trend: "↑ 2.4%",
      tone: "bg-white/20 text-[#dcfff1]",
      icon: "wallet" as const,
      iconBg: "rounded-full bg-white/10 p-0.5",
      iconColor: "text-white",
      className:
        "summary-hero-card border-[#1d4ed8] bg-[#0f3ea8] text-white shadow-[0_18px_34px_rgba(15,62,168,0.18)]",
      titleClassName: "text-white/72",
      detailClassName: "text-white/72",
      trendContainerClassName: "border-white/12",
      chevronClassName: "text-white/60",
      valueClassName: "text-white",
    },
    {
      label: "Monthly Income",
      value: "Rp 5.250.000",
      detail: "salary + transfers",
      trend: incomeChange !== null ? `↑ ${incomeChange.toFixed(1)}%` : null,
      tone: getTrendTone(incomeChange),
      icon: "download" as const,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
    {
      label: "Total Expenses",
      value: "Rp 3.990.000",
      detail: "vs last month",
      trend: "↓ 5.1%",
      tone: getTrendTone(-5.1, true),
      icon: "upload" as const,
      iconBg: "bg-danger/10",
      iconColor: "text-danger",
    },
    {
      label: "Remaining",
      value: "Rp 1.260.000",
      detail: "of Rp 2.200.000 budget",
      trend:
        remainingChange !== null ? `↑ ${remainingChange.toFixed(0)}%` : null,
      tone: getTrendTone(remainingChange),
      icon: "receipt" as const,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
    },
    {
      label: "Savings Rate",
      value: "24%",
      detail: "target 25%",
      trend: "↑ 2 pts",
      tone: "text-success",
      icon: "piggy" as const,
      iconBg: "bg-success/10",
      iconColor: "text-success",
    },
  ];

  const currentNet =
    currentCashFlow && previousCashFlow
      ? currentCashFlow.income - currentCashFlow.expenses
      : null;
  const averageDailySpend = currentCashFlow
    ? Math.round(currentCashFlow.expenses / 30)
    : null;

  return (
    <div className="flex w-full flex-col gap-4 px-3 pt-[60px] pb-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.label}
            title={card.label}
            value={card.value}
            detail={card.detail}
            trend={card.trend}
            trendClassName={card.tone}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            className={cn("px-[18px] py-4", card.className)}
            titleClassName={card.titleClassName}
            detailClassName={card.detailClassName}
            trendContainerClassName={card.trendContainerClassName}
            chevronClassName={card.chevronClassName}
            valueClassName={cn(
              "truncate text-2xl font-bold tracking-tight",
              card.valueClassName,
            )}
          />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <div className="dashboard-featured-card rounded-[20px] p-[18px]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold">Cash Flow</h2>
                <p className="mt-0.5 text-[11px] text-tertiary">
                  Income vs expenses
                </p>
              </div>
              <div className="shrink-0 flex rounded-[8px] bg-surface-muted p-0.5">
                <button className="rounded-[6px] px-3 py-1 text-[11px] font-medium text-tertiary">
                  Weekly
                </button>
                <button className="rounded-[6px] border border-subtle bg-surface px-3 py-1 text-[11px] font-medium text-primary dark:bg-surface-raised">
                  Monthly
                </button>
              </div>
            </div>
            <div className="mb-2 flex items-center gap-4 text-[11px] text-tertiary">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-danger" />
                Expenses
              </span>
            </div>
            <div className="h-[260px] w-full">
              {isClient ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={1}
                  minHeight={1}
                >
                  <AreaChart
                    data={overviewCashFlowData}
                    margin={{ top: 8, right: 6, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="incomeGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--success)"
                          stopOpacity={0.14}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--success)"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="expenseGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--danger)"
                          stopOpacity={0.1}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--danger)"
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
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "var(--text-tertiary)" }}
                    />
                    <YAxis hide />
                    <RechartsTooltip
                      formatter={(value) =>
                        typeof value === "number" ? formatCurrency(value) : "-"
                      }
                      contentStyle={{
                        border: "1px solid rgba(0,0,0,0.08)",
                        borderRadius: 10,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="var(--success)"
                      strokeWidth={2.5}
                      fill="url(#incomeGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="var(--danger)"
                      strokeWidth={2.5}
                      fill="url(#expenseGrad)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full rounded-[10px] bg-surface-muted" />
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
              <h2 className="text-[13px] font-semibold">Income vs Expense</h2>
              <p className="mt-0.5 text-[11px] text-tertiary">April 2025</p>
              <p className="mt-4 text-2xl font-bold text-success">+Rp 3,11jt</p>
              <p className="text-[11px] text-tertiary">net this month</p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted">
                <div className="flex h-full">
                  <div
                    className="h-full rounded-l-full bg-success"
                    style={{ width: "64%" }}
                  />
                  <div
                    className="h-full rounded-r-full bg-danger"
                    style={{ width: "36%" }}
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-[9px] bg-success/10 px-3 py-2">
                  <p className="font-semibold text-success">Income</p>
                  <p className="text-primary">64%</p>
                </div>
                <div className="rounded-[9px] bg-danger/10 px-3 py-2">
                  <p className="font-semibold text-danger">Expense</p>
                  <p className="text-primary">36%</p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
              <h2 className="text-[13px] font-semibold">Top Merchants</h2>
              <p className="mt-0.5 text-[11px] text-tertiary">by total spend</p>
              <div className="mt-3 space-y-2">
                {overviewMerchants.map((merchant) => (
                  <div key={merchant.name} className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-raised text-base">
                      {merchant.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">
                      {merchant.name}
                    </span>
                    <span className="text-xs font-semibold">
                      {merchant.amount}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                        merchant.change.startsWith("+")
                          ? "bg-danger/10 text-danger"
                          : merchant.change.startsWith("-")
                            ? "bg-success/10 text-success"
                            : "bg-surface-raised text-tertiary",
                      )}
                    >
                      {merchant.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-subtle bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
            <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-[18px] py-3.5">
              <div>
                <h2 className="text-[13px] font-semibold">
                  Recent Transactions
                </h2>
              </div>
              <Button
                variant="ghost"
                className="ml-auto h-8 px-2 text-xs text-accent"
                render={<Link href="/transactions" />}
              >
                See all →
              </Button>
            </div>
            <CupertinoTable
              columnsClassName="grid-cols-[70px_minmax(0,1.2fr)_minmax(0,1fr)_110px_118px_112px_96px_34px]"
              minWidthClassName="min-w-[860px]"
              headers={[
                { key: "date", label: "Date" },
                { key: "merchant", label: "Merchant" },
                { key: "note", label: "Note" },
                { key: "amount", label: "Amount" },
                { key: "category", label: "Category" },
                { key: "wallet", label: "Wallet" },
                { key: "createdBy", label: "Created by" },
                { key: "open", label: "" },
              ]}
              hasRows={recentTransactions.length > 0}
            >
              {recentTransactions.slice(0, 6).map((transaction) => (
                <button
                  key={transaction.id}
                  className={cn(
                    "grid w-full grid-cols-[70px_minmax(0,1.2fr)_minmax(0,1fr)_110px_118px_112px_96px_34px] items-center gap-3 px-[18px] text-left transition hover:bg-surface-muted",
                    CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
                  )}
                  onClick={() => onSelectTransaction(transaction)}
                >
                  <span className="text-[10px] text-tertiary">
                    {formatDate(transaction.date).replace(" 2026", "")}
                  </span>
                  <span className="min-w-0 pr-3">
                    <span className="block truncate text-[11px] font-medium">
                      {transaction.merchant}
                    </span>
                  </span>
                  <span className="truncate pr-2 text-[10px] text-secondary">
                    {transaction.note || "No note"}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold",
                      transaction.amount > 0 ? "text-success" : "text-primary",
                    )}
                  >
                    {transaction.amount > 0 ? "+" : "-"}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                  <span className="truncate pr-2 text-[10px] text-secondary">
                    {transaction.category}
                  </span>
                  <span className="truncate pr-2 text-[10px] text-secondary">
                    {transaction.wallet}
                  </span>
                  <span className="flex items-center gap-2 pr-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-raised text-[9px] font-semibold text-primary">
                      {getInitials(transaction.createdBy)}
                    </span>
                    <span className="truncate text-[10px] text-secondary">
                      {transaction.createdBy}
                    </span>
                  </span>
                  <span className="flex justify-center">
                    <CupertinoIcon
                      name="more"
                      className="size-3.5 text-tertiary"
                    />
                  </span>
                </button>
              ))}
            </CupertinoTable>
          </div>
        </div>

        <div className="space-y-3 xl:col-span-2">
          <div className="dashboard-featured-card rounded-[20px] p-[18px]">
            <div className="mb-3">
              <h2 className="text-[13px] font-semibold">Budget Progress</h2>
              <p className="mt-0.5 text-[11px] text-tertiary">April 2025</p>
            </div>
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <div className="relative size-[132px] shrink-0">
                {isClient ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overallBudgetUsage}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={58}
                        startAngle={90}
                        endAngle={-270}
                        paddingAngle={2}
                        cornerRadius={6}
                        stroke="none"
                      >
                        {overallBudgetUsage.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="size-full rounded-full bg-surface-muted" />
                )}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[28px] font-bold leading-none text-primary">
                    78%
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-tertiary">
                    Used
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div>
                  <p className="text-2xl font-bold">Rp 3.990.000</p>
                  <p className="text-[11px] text-tertiary">of Rp 5.120.000</p>
                  <p className="mt-1 text-[11px] text-tertiary">7 days left</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-medium">
                    <span className="rounded-full bg-warning/12 px-2.5 py-1 text-warning">
                      22% left
                    </span>
                    <span className="rounded-full bg-danger/10 px-2.5 py-1 text-danger">
                      Dining over cap
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {overviewBudgetCategories.map((category) => (
                <div key={category.name}>
                  <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                    <span className="font-medium">{category.name}</span>
                    {category.over ? (
                      <span className="rounded-[4px] bg-danger/10 px-1.5 py-0.5 text-[9px] font-bold text-danger">
                        OVER
                      </span>
                    ) : null}
                    <span className="ml-auto text-tertiary">
                      {category.spent} / {category.limit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${category.percent}%`,
                        background: getBudgetBarColor(
                          category.percent,
                          category.over,
                        ),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold">Alerts</h2>
                <p className="mt-0.5 text-[11px] text-tertiary">3</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {overviewAlerts.map((alert) => (
                <div
                  key={alert.title}
                  className={cn(
                    "flex gap-2 rounded-[10px] p-2.5",
                    alert.type === "info"
                      ? "bg-[var(--accent)]/10"
                      : alert.type === "warning"
                        ? "bg-warning/10"
                        : "bg-danger/10",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-surface text-[10px] font-bold dark:bg-surface-muted",
                      alert.type === "info"
                        ? "text-accent"
                        : alert.type === "warning"
                          ? "text-warning"
                          : "text-danger",
                    )}
                  >
                    {alert.marker}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{alert.title}</p>
                    <p className="mt-0.5 text-[10px] text-tertiary">
                      {alert.description}
                    </p>
                  </div>
                  <WorkspaceTopBarActionButton size="sm">
                    Review
                  </WorkspaceTopBarActionButton>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
            <h2 className="text-[13px] font-semibold">Quick Actions</h2>
            <div className="mt-3 grid gap-2">
              {overviewQuickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-9 justify-start rounded-[9px] border-strong bg-surface-muted px-3 text-xs shadow-none"
                  render={<Link href={action.href} />}
                >
                  <CupertinoIcon name={action.icon} className="size-3.5" />
                  {action.title}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DashboardWorkspace() {
  const { state } = useFileWorkspace();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { wallets, activeWallet } = useWallets();
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
    return availableTransactions.filter((transaction) => {
      if (activeWallet !== "all" && transaction.wallet !== activeWallet) {
        return false;
      }

      return true;
    });
  }, [activeWallet, availableTransactions]);

  return (
    <main className="min-h-svh bg-app text-primary">
      <WorkspaceTopBar
        title="Nidhi.id Overview"
        variant="fixed"
        actions={
          <>
            <WalletSelect />
            <WorkspaceTopBarActionButton
              onClick={() => setIsWalletDialogOpen(true)}
            >
              <CupertinoIcon name="plus" className="size-3.5" />
              Add wallet
            </WorkspaceTopBarActionButton>
          </>
        }
      />

      <DashboardOverview
        isClient={isClient}
        recentTransactions={filteredTransactions}
        wallets={wallets}
        onSelectTransaction={setSelectedTx}
      />

      <TransactionDetailDialog
        transaction={selectedTx}
        open={selectedTx !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTx(null);
          }
        }}
      />

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
      />
    </main>
  );
}
