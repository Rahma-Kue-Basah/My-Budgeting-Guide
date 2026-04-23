"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AddWalletDialog,
  useDashboardWallets,
} from "@/features/dashboard/dashboard-wallets";

type DashboardTransaction = {
  id: string;
  date: string;
  merchant: string;
  note: string;
  category: string;
  wallet: string;
  amount: number;
  status: "cleared" | "pending" | "review";
};

type ChartMode = "expense" | "income" | "balance";
type DashboardWorkspaceVariant = "dashboard" | "transactions";
type SortColumn =
  | "date"
  | "merchant"
  | "category"
  | "wallet"
  | "amount"
  | "status";
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
    status: "cleared",
  },
  {
    id: "tx-02",
    date: "2026-04-22",
    merchant: "Tokopedia",
    note: "Home supplies",
    category: "Shopping",
    wallet: "BCA",
    amount: -843500,
    status: "cleared",
  },
  {
    id: "tx-03",
    date: "2026-04-21",
    merchant: "Bluebird",
    note: "Office commute",
    category: "Transport",
    wallet: "Mandiri",
    amount: -128000,
    status: "pending",
  },
  {
    id: "tx-04",
    date: "2026-04-20",
    merchant: "PLN",
    note: "Electricity bill",
    category: "Utilities",
    wallet: "BCA",
    amount: -614700,
    status: "cleared",
  },
  {
    id: "tx-05",
    date: "2026-04-19",
    merchant: "Sushi Hiro",
    note: "Dinner",
    category: "Food",
    wallet: "Amex Gold",
    amount: -512000,
    status: "review",
  },
  {
    id: "tx-06",
    date: "2026-04-18",
    merchant: "Transfer from Raka",
    note: "Project reimbursement",
    category: "Income",
    wallet: "Chase Sapphire",
    amount: 2250000,
    status: "cleared",
  },
  {
    id: "tx-07",
    date: "2026-04-17",
    merchant: "Guardian",
    note: "Health essentials",
    category: "Health",
    wallet: "Mandiri",
    amount: -286000,
    status: "cleared",
  },
  {
    id: "tx-08",
    date: "2026-04-16",
    merchant: "Netflix",
    note: "Subscription",
    category: "Entertainment",
    wallet: "Amex Gold",
    amount: -186000,
    status: "cleared",
  },
  {
    id: "tx-09",
    date: "2026-04-15",
    merchant: "Starbucks",
    note: "Client meeting",
    category: "Food",
    wallet: "BCA",
    amount: -94000,
    status: "pending",
  },
  {
    id: "tx-10",
    date: "2026-04-14",
    merchant: "Ace Hardware",
    note: "Repair tools",
    category: "Home",
    wallet: "BCA",
    amount: -735000,
    status: "cleared",
  },
  {
    id: "tx-11",
    date: "2026-04-12",
    merchant: "Mutual Fund Dividend",
    note: "Investment yield",
    category: "Income",
    wallet: "Mandiri",
    amount: 780000,
    status: "cleared",
  },
  {
    id: "tx-12",
    date: "2026-04-10",
    merchant: "Pertamina",
    note: "Fuel",
    category: "Transport",
    wallet: "BCA",
    amount: -350000,
    status: "cleared",
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

const monthlyBars = [
  { month: "May", total: 0 },
  { month: "Jun", total: 0 },
  { month: "Jul", total: 0 },
  { month: "Aug", total: 0 },
  { month: "Sep", total: 0 },
  { month: "Oct", total: 0 },
  { month: "Nov", total: 0 },
  { month: "Dec", total: 0 },
  { month: "Jan", total: 0 },
  { month: "Feb", total: 0 },
  { month: "Mar", total: 0 },
  { month: "Apr", total: 1 },
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
  {
    name: "Housing",
    spent: "Rp 2.500",
    limit: "Rp 2.500",
    percent: 100,
    color: "#007AFF",
  },
  {
    name: "Groceries",
    spent: "Rp 412",
    limit: "Rp 600",
    percent: 69,
    color: "#30d158",
  },
  {
    name: "Dining",
    spent: "Rp 531",
    limit: "Rp 400",
    percent: 100,
    color: "#ff453a",
    over: true,
  },
  {
    name: "Transportation",
    spent: "Rp 188",
    limit: "Rp 300",
    percent: 63,
    color: "#ff9f0a",
  },
  {
    name: "Subscriptions",
    spent: "Rp 96",
    limit: "Rp 120",
    percent: 80,
    color: "#ac8cf0",
  },
  {
    name: "Fitness",
    spent: "Rp 68",
    limit: "Rp 100",
    percent: 68,
    color: "#32ade6",
  },
];

const overviewMerchants = [
  { icon: "🛒", name: "Whole Foods", amount: "Rp 412", change: "+8%" },
  { icon: "📦", name: "Amazon", amount: "Rp 318", change: "+22%" },
  { icon: "🍔", name: "Uber Eats", amount: "Rp 247", change: "+41%" },
  { icon: "⛽", name: "Shell", amount: "Rp 188", change: "-3%" },
  { icon: "🚴", name: "SoulCycle", amount: "Rp 136", change: "-" },
];

const overviewAlerts = [
  {
    type: "warning",
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

type DashboardWorkspaceProps = {
  variant?: DashboardWorkspaceVariant;
};

function DashboardOverview({
  isClient,
  recentTransactions,
  onSelectTransaction,
}: {
  isClient: boolean;
  recentTransactions: DashboardTransaction[];
  onSelectTransaction: (transaction: DashboardTransaction) => void;
}) {
  const summaryCards = [
    {
      label: "Total Balance",
      value: "Rp 28.416.000",
      detail: "vs last month",
      trend: "↑ 2.4%",
      tone: "text-[#30d158]",
    },
    {
      label: "Monthly Income",
      value: "Rp 5.250.000",
      detail: "salary + transfers",
      trend: null,
      tone: "text-[#1c1c1e]",
    },
    {
      label: "Total Expenses",
      value: "Rp 3.990.000",
      detail: "vs last month",
      trend: "↓ 5.1%",
      tone: "text-[#30d158]",
    },
    {
      label: "Remaining",
      value: "Rp 1.260.000",
      detail: "of Rp 2.200.000 budget",
      trend: null,
      tone: "text-[#1c1c1e]",
    },
    {
      label: "Savings Rate",
      value: "24%",
      detail: "target 25%",
      trend: "↑ 2 pts",
      tone: "text-[#30d158]",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-3 px-3 pt-[132px] pb-3 md:px-3 md:pt-[70px]">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[13px] bg-white px-[18px] py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
          >
            <p className="mb-1.5 text-[11px] font-medium text-[#8e8e93]">
              {card.label}
            </p>
            <p className="truncate text-xl font-bold text-[#1c1c1e]">
              {card.value}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[11px]">
              {card.trend ? (
                <span className={cn("font-semibold", card.tone)}>
                  {card.trend}
                </span>
              ) : null}
              <span className="truncate text-[#8e8e93]">{card.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-[13px] font-semibold">Cash Flow</h2>
              <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                Income vs expenses
              </p>
            </div>
            <div className="ml-auto flex rounded-[8px] bg-[#f2f2f4] p-0.5">
              <button className="rounded-[6px] px-3 py-1 text-[11px] font-medium text-[#8e8e93]">
                Weekly
              </button>
              <button className="rounded-[6px] bg-white px-3 py-1 text-[11px] font-medium text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
                Monthly
              </button>
            </div>
          </div>
          <div className="mb-2 flex items-center gap-4 text-[11px] text-[#8e8e93]">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#30d158]" />
              Income
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#ff453a]" />
              Expenses
            </span>
          </div>
          <div className="h-[246px]">
            {isClient ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <LineChart
                  data={overviewCashFlowData}
                  margin={{ top: 8, right: 6, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    stroke="rgba(0,0,0,0.06)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: "#8e8e93" }}
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
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#30d158"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ff453a"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full rounded-[10px] bg-[#f7f7f8]" />
            )}
          </div>
        </div>

        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="mb-3">
            <h2 className="text-[13px] font-semibold">Budget Progress</h2>
            <p className="mt-0.5 text-[11px] text-[#8e8e93]">April 2025</p>
          </div>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-lg font-bold">Rp 3.990.000</p>
              <p className="text-[11px] text-[#8e8e93]">of Rp 5.120.000</p>
            </div>
            <div className="text-right text-[11px]">
              <p className="font-semibold text-[#1c1c1e]">78% used</p>
              <p className="text-[#8e8e93]">7 days left</p>
            </div>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#f2f2f4]">
            <div className="h-full w-[78%] rounded-full bg-[#007AFF]" />
          </div>
          <div className="space-y-3">
            {overviewBudgetCategories.map((category) => (
              <div key={category.name}>
                <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                  <span className="font-medium">{category.name}</span>
                  {category.over ? (
                    <span className="rounded-[4px] bg-[#ff453a]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#ff453a]">
                      OVER
                    </span>
                  ) : null}
                  <span className="ml-auto text-[#8e8e93]">
                    {category.spent} / {category.limit}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f2f2f4]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${category.percent}%`,
                      background: category.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.85fr_0.9fr_1fr]">
        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="text-[13px] font-semibold">Income vs Expense</h2>
          <p className="mt-0.5 text-[11px] text-[#8e8e93]">April 2025</p>
          <p className="mt-4 text-2xl font-bold text-[#30d158]">+Rp 3,11jt</p>
          <p className="text-[11px] text-[#8e8e93]">net this month</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ff453a]">
            <div className="h-full w-[64%] rounded-r-full bg-[#30d158]" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-[9px] bg-[#30d158]/10 px-3 py-2">
              <p className="font-semibold text-[#30d158]">Income</p>
              <p className="text-[#1c1c1e]">64%</p>
            </div>
            <div className="rounded-[9px] bg-[#ff453a]/10 px-3 py-2">
              <p className="font-semibold text-[#ff453a]">Expense</p>
              <p className="text-[#1c1c1e]">36%</p>
            </div>
          </div>
        </div>

        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="text-[13px] font-semibold">Top Merchants</h2>
          <p className="mt-0.5 text-[11px] text-[#8e8e93]">by total spend</p>
          <div className="mt-3 space-y-2">
            {overviewMerchants.map((merchant) => (
              <div key={merchant.name} className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f2f2f4] text-base">
                  {merchant.icon}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {merchant.name}
                </span>
                <span className="text-xs font-semibold">{merchant.amount}</span>
                <span
                  className={cn(
                    "w-8 text-right text-[10px] font-semibold",
                    merchant.change.startsWith("+")
                      ? "text-[#ff453a]"
                      : merchant.change.startsWith("-")
                        ? "text-[#30d158]"
                        : "text-[#8e8e93]",
                  )}
                >
                  {merchant.change}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-[13px] font-semibold">Alerts</h2>
              <p className="mt-0.5 text-[11px] text-[#8e8e93]">3</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {overviewAlerts.map((alert) => (
              <div
                key={alert.title}
                className={cn(
                  "flex gap-2 rounded-[10px] p-2.5",
                  alert.type === "info" ? "bg-[#007AFF]/10" : "bg-[#ff453a]/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-white text-[10px] font-bold",
                    alert.type === "info" ? "text-[#007AFF]" : "text-[#ff453a]",
                  )}
                >
                  {alert.marker}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{alert.title}</p>
                  <p className="mt-0.5 text-[10px] text-[#8e8e93]">
                    {alert.description}
                  </p>
                </div>
                <Button className="h-7 rounded-[7px] bg-[#1c1c1e] px-2 text-[10px] text-white shadow-none hover:bg-black">
                  Review
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <h2 className="text-[13px] font-semibold">Quick Actions</h2>
          <div className="mt-3 grid gap-2">
            {overviewQuickActions.map((action) => (
              <Button
                key={action.title}
                variant="outline"
                className="h-9 justify-start rounded-[9px] border-black/10 bg-[#f2f2f4] px-3 text-xs shadow-none"
                render={<Link href={action.href} />}
              >
                <CupertinoIcon name={action.icon} className="size-3.5" />
                {action.title}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-black/5 px-[18px] py-3.5">
            <div>
              <h2 className="text-[13px] font-semibold">Recent Transactions</h2>
            </div>
            <Button
              variant="outline"
              className="ml-auto h-8 rounded-[8px] border-black/10 bg-[#f2f2f4] px-3 text-xs shadow-none"
            >
              Filter
            </Button>
            <Button
              variant="ghost"
              className="h-8 px-2 text-xs text-[#007AFF]"
              render={<Link href="/transactions" />}
            >
              See all →
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[70px_1fr_118px_112px_116px_96px_34px] border-b border-black/[0.04] px-[18px] py-2">
                {[
                  "Date",
                  "Merchant",
                  "Category",
                  "Wallet",
                  "Amount",
                  "Status",
                ].map((label) => (
                  <span
                    key={label}
                    className="text-left text-[10px] font-semibold tracking-[0.04em] text-[#8e8e93] uppercase"
                  >
                    {label}
                  </span>
                ))}
                <span />
              </div>

              <div>
                {recentTransactions.slice(0, 6).map((transaction, index) => (
                  <button
                    key={transaction.id}
                    className="grid w-full grid-cols-[70px_1fr_118px_112px_116px_96px_34px] items-center border-b border-black/[0.04] px-[18px] py-2 text-left transition hover:bg-black/[0.014]"
                    onClick={() => onSelectTransaction(transaction)}
                  >
                    <span className="text-[10px] text-[#8e8e93]">
                      {formatDate(transaction.date).replace(" 2026", "")}
                    </span>
                    <span className="min-w-0 pr-3">
                      <span className="block truncate text-[11px] font-medium">
                        {transaction.merchant}
                      </span>
                      {transaction.note ? (
                        <span className="mt-0.5 block truncate text-[10px] text-[#8e8e93]">
                          {transaction.note}
                        </span>
                      ) : null}
                    </span>
                    <span className="truncate pr-2 text-[10px] text-[#636366]">
                      {transaction.category}
                    </span>
                    <span className="truncate pr-2 text-[10px] text-[#636366]">
                      {transaction.wallet}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        transaction.amount > 0
                          ? "text-[#30d158]"
                          : "text-[#1c1c1e]",
                      )}
                    >
                      {transaction.amount > 0 ? "+" : "-"}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                    <StatusBadge status={transaction.status} compact />
                    <span className="flex justify-center">
                      <CupertinoIcon
                        name="more"
                        className={cn(
                          "size-3.5 text-[#8e8e93]",
                          index >= 0 && "opacity-80",
                        )}
                      />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({
  status,
  compact = false,
}: {
  status: DashboardTransaction["status"];
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium capitalize",
        compact ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-[11px]",
        status === "cleared" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "review" && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {status}
    </span>
  );
}

export function DashboardWorkspace({
  variant = "dashboard",
}: DashboardWorkspaceProps) {
  const { state } = useFileWorkspace();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { wallets, activeWallet, setActiveWallet } = useDashboardWallets();
  const [chartMode, setChartMode] = useState<ChartMode>("expense");
  const [filterStatus, setFilterStatus] = useState<
    "all" | DashboardTransaction["status"]
  >("all");
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedTx, setSelectedTx] = useState<DashboardTransaction | null>(
    null,
  );
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const isTransactionsPage = variant === "transactions";
  const pageTitle = isTransactionsPage ? "Transactions" : "MBG Overview Dashboard";

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
          status: "cleared",
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

        if (filterStatus !== "all" && transaction.status !== filterStatus) {
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
          transaction.status,
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
  }, [
    activeWallet,
    availableTransactions,
    filterStatus,
    search,
    sortColumn,
    sortDirection,
  ]);

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
      color: "text-[#30d158]",
    },
    {
      label: "Total Expenses",
      value: formatCurrency(totals.expense),
      color: "text-[#ff453a]",
    },
    {
      label: "Net",
      value: `${totals.net >= 0 ? "+" : "-"}${formatCurrency(Math.abs(totals.net))}`,
      color: totals.net >= 0 ? "text-[#30d158]" : "text-[#ff453a]",
    },
    {
      label: "Transactions",
      value: String(totals.count),
      color: "text-[#1c1c1e]",
    },
  ];

  return (
    <main className="min-h-svh bg-[#f2f2f4] text-[#1c1c1e]">
      <header className="fixed top-[58px] right-0 left-0 z-20 border-b border-black/[0.06] bg-white md:top-0 md:left-[232px] md:w-[calc(100%-232px)]">
        <div className="flex h-[58px] w-full items-center gap-3 px-3">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-normal">
              {pageTitle}
            </h1>
          </div>

          <div className="ml-auto hidden flex-wrap items-center gap-2 sm:flex">
            <div className="flex h-9 items-center gap-2 rounded-[9px] border border-black/10 bg-[#f2f2f4] px-3">
              <CupertinoIcon name="wallet" className="size-4 text-[#8e8e93]" />
              <select
                value={activeWallet}
                onChange={(event) => setActiveWallet(event.target.value)}
                className="h-full min-w-[150px] border-0 bg-transparent text-xs font-medium outline-none"
              >
                <option value="all">All wallets</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.name}>
                    {wallet.name}
                  </option>
                ))}
              </select>
              <CupertinoIcon
                name="chevronDown"
                className="size-3.5 text-[#8e8e93]"
              />
            </div>

            <Button
              className="h-9 rounded-[9px] bg-[#1c1c1e] px-3 text-white shadow-none hover:bg-black"
              onClick={() => setIsWalletDialogOpen(true)}
            >
              <CupertinoIcon name="plus" className="size-3.5" />
              Add wallet
            </Button>
          </div>
        </div>
      </header>

      {isTransactionsPage ? (
      <div className="flex w-full flex-col gap-4 px-3 pt-[132px] pb-3 md:px-3 md:pt-[70px]">
        <section>
          <div className="flex min-w-0 flex-col gap-3">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-[13px] bg-white px-[18px] py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  <p className="mb-1.5 text-[11px] font-medium text-[#8e8e93]">
                    {card.label}
                  </p>
                  <p className={cn("truncate text-xl font-bold", card.color)}>
                    {card.value}
                  </p>
                </div>
              ))}
            </section>

            <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_316px]">
              <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-[13px] font-semibold">
                      Daily Activity
                    </h2>
                    <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                      Apr 8 - Apr 22
                    </p>
                  </div>
                  <div className="flex rounded-[8px] bg-[#f2f2f4] p-0.5 sm:ml-auto">
                    {[
                      ["expense", "Expenses"],
                      ["income", "Income"],
                      ["balance", "Net Balance"],
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        className={cn(
                          "rounded-[6px] px-3 py-1 text-[11px] font-medium transition",
                          chartMode === key
                            ? "bg-white text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                            : "text-[#8e8e93]",
                        )}
                        onClick={() => setChartMode(key as ChartMode)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-[210px]">
                  {isClient ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={1}
                      minHeight={1}
                    >
                      <LineChart
                        data={chartData}
                        margin={{ top: 8, right: 10, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid
                          stroke="rgba(0,0,0,0.06)"
                          strokeDasharray="4 4"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10, fill: "#8e8e93" }}
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
                        <Line
                          type="monotone"
                          dataKey={chartMode}
                          stroke={
                            chartMode === "income"
                              ? "#30d158"
                              : chartMode === "expense"
                                ? "#ff453a"
                                : "#007aff"
                          }
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-[10px] bg-[#f7f7f8]" />
                  )}
                </div>
              </div>

              <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <h2 className="text-[13px] font-semibold">Budget Progress</h2>
                <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                  April category limits
                </p>
                <div className="mt-4 space-y-4">
                  {[
                    ["Food", 78, "#007aff"],
                    ["Transport", 64, "#30d158"],
                    ["Shopping", 100, "#ff453a"],
                    ["Utilities", 46, "#ff9f0a"],
                  ].map(([label, value, color]) => (
                    <div key={label as string}>
                      <div className="mb-1.5 flex justify-between text-[11px]">
                        <span className="font-medium">{label}</span>
                        <span className="text-[#8e8e93]">{value}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[#f2f2f4]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${value}%`,
                            background: color as string,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {isTransactionsPage ? (
              <section className="overflow-hidden rounded-[13px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                <div className="flex flex-wrap items-center gap-2 border-b border-black/5 px-[18px] py-3.5">
                  <div className="flex rounded-[9px] bg-[#f2f2f4] p-[3px]">
                    {(["all", "cleared", "pending", "review"] as const).map(
                      (status) => (
                        <button
                          key={status}
                          className={cn(
                            "rounded-[7px] px-2.5 py-1 text-[11px] font-medium capitalize",
                            filterStatus === status
                              ? "bg-white text-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                              : "text-[#8e8e93]",
                          )}
                          onClick={() => setFilterStatus(status)}
                        >
                          {status === "all" ? "All" : status}
                        </button>
                      ),
                    )}
                  </div>

                  <div className="ml-auto flex min-w-[210px] items-center gap-2 rounded-[8px] border border-black/10 bg-[#f2f2f4] px-2.5 py-1.5">
                    <CupertinoIcon
                      name="search"
                      className="size-3.5 text-[#8e8e93]"
                    />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search..."
                      className="w-full border-0 bg-transparent text-xs outline-none placeholder:text-[#8e8e93]"
                    />
                  </div>

                  <Button className="h-8 rounded-[8px] bg-[#1c1c1e] px-3 text-white shadow-none hover:bg-black">
                    <CupertinoIcon name="plus" className="size-3.5" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 rounded-[8px] border-black/10 bg-[#f2f2f4] px-3 shadow-none"
                    render={<Link href="/file" />}
                  >
                    <CupertinoIcon name="upload" className="size-3.5" />
                    Import
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <div className="min-w-[840px]">
                    <div className="grid grid-cols-[78px_1fr_130px_120px_120px_110px_40px] border-b border-black/[0.04] px-[18px] py-2">
                      {[
                        ["date", "Date"],
                        ["merchant", "Merchant"],
                        ["category", "Category"],
                        ["wallet", "Wallet"],
                        ["amount", "Amount"],
                        ["status", "Status"],
                      ].map(([key, label]) => (
                        <button
                          key={key}
                          className="flex items-center gap-1 text-left text-[10px] font-semibold tracking-[0.04em] text-[#8e8e93] uppercase"
                          onClick={() => toggleSort(key as SortColumn)}
                        >
                          {label}
                          {sortColumn === key ? (
                            <span>
                              {sortDirection === "asc" ? "up" : "down"}
                            </span>
                          ) : null}
                        </button>
                      ))}
                      <span />
                    </div>

                    <div className="max-h-[calc(100vh-420px)] min-h-[260px] overflow-y-auto">
                      {filteredTransactions.length === 0 ? (
                        <div className="px-5 py-14 text-center text-sm text-[#8e8e93]">
                          No transactions found
                        </div>
                      ) : null}
                      {filteredTransactions.map((transaction, index) => (
                        <button
                          key={transaction.id}
                          className="grid w-full grid-cols-[78px_1fr_130px_120px_120px_110px_40px] items-center border-b border-black/[0.04] px-[18px] py-2.5 text-left transition hover:bg-black/[0.014]"
                          onClick={() => setSelectedTx(transaction)}
                        >
                          <span className="text-[11px] text-[#8e8e93]">
                            {formatDate(transaction.date).replace(" 2026", "")}
                          </span>
                          <span className="min-w-0 pr-3">
                            <span className="block truncate text-xs font-medium">
                              {transaction.merchant}
                            </span>
                            {transaction.note ? (
                              <span className="mt-0.5 block truncate text-[10px] text-[#8e8e93]">
                                {transaction.note}
                              </span>
                            ) : null}
                          </span>
                          <span className="truncate pr-2 text-[11px] text-[#636366]">
                            {transaction.category}
                          </span>
                          <span className="truncate pr-2 text-[11px] text-[#636366]">
                            {transaction.wallet}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              transaction.amount > 0
                                ? "text-[#30d158]"
                                : "text-[#1c1c1e]",
                            )}
                          >
                            {transaction.amount > 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                          <StatusBadge status={transaction.status} />
                          <span className="flex justify-center">
                            <CupertinoIcon
                              name="more"
                              className={cn(
                                "size-4 text-[#8e8e93]",
                                index >= 0 && "opacity-80",
                              )}
                            />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_316px]">
                <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[13px] font-semibold">
                        Recent Activity
                      </h2>
                      <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                        Latest wallet movements
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="h-8 rounded-[8px] border-black/10 bg-[#f2f2f4] px-3 shadow-none"
                      render={<Link href="/transactions" />}
                    >
                      View all
                    </Button>
                  </div>
                  <div className="divide-y divide-black/[0.04]">
                    {filteredTransactions.slice(0, 6).map((transaction) => (
                      <button
                        key={transaction.id}
                        className="flex w-full items-center gap-3 py-2.5 text-left"
                        onClick={() => setSelectedTx(transaction)}
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#f2f2f4]">
                          <CupertinoIcon
                            name={transaction.amount > 0 ? "download" : "upload"}
                            className="size-3.5 text-[#636366]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">
                            {transaction.merchant}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-[#8e8e93]">
                            {transaction.category} · {transaction.wallet}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-xs font-semibold",
                              transaction.amount > 0
                                ? "text-[#30d158]"
                                : "text-[#1c1c1e]",
                            )}
                          >
                            {transaction.amount > 0 ? "+" : "-"}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </p>
                          <p className="mt-0.5 text-[10px] text-[#8e8e93]">
                            {formatDate(transaction.date).replace(" 2026", "")}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[13px] bg-white p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
                  <h2 className="text-[13px] font-semibold">Wallet Mix</h2>
                  <p className="mt-0.5 text-[11px] text-[#8e8e93]">
                    Active balance sources
                  </p>
                  <div className="mt-4 space-y-2">
                    {wallets.slice(0, 5).map((wallet) => (
                      <div
                        key={wallet.id}
                        className="flex items-center gap-2 rounded-[10px] bg-[#f2f2f4] px-2.5 py-2"
                      >
                        <span
                          className="size-3 rounded-full"
                          style={{ background: wallet.color }}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {wallet.name}
                        </span>
                        <span className="text-[11px] text-[#8e8e93]">
                          {wallet.institution}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </div>
        </section>
      </div>
      ) : (
        <DashboardOverview
          isClient={isClient}
          recentTransactions={filteredTransactions}
          onSelectTransaction={setSelectedTx}
        />
      )}

      {selectedTx ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-[20px] bg-[#f2f2f4] shadow-[0_32px_100px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-center px-5 pt-[18px] pb-3">
              <span className="text-[15px] font-semibold">Transaction</span>
              <button
                className="absolute top-3.5 right-4 flex size-7 items-center justify-center rounded-full bg-black/10"
                onClick={() => setSelectedTx(null)}
              >
                <CupertinoIcon
                  name="close"
                  className="size-3.5 text-[#636366]"
                />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 px-4 pb-5">
              <div className="rounded-[12px] bg-white px-4 py-3">
                <p className="mb-1.5 text-[11px] text-[#636366]">Amount</p>
                <p
                  className={cn(
                    "text-[26px] font-bold",
                    selectedTx.amount > 0 ? "text-[#30d158]" : "text-[#1c1c1e]",
                  )}
                >
                  {selectedTx.amount > 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(selectedTx.amount))}
                </p>
              </div>

              <div className="rounded-[12px] bg-white px-4 py-3">
                <p className="mb-1.5 text-[11px] text-[#636366]">Your note</p>
                <p className="text-[13px] text-[#1c1c1e]">
                  {selectedTx.note || "Add note"}
                </p>
              </div>

              <div className="rounded-[12px] bg-white px-4 py-3.5">
                <div className="mb-3.5 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-[8px] bg-black/5">
                      <CupertinoIcon
                        name="wallet"
                        className="size-4 text-[#636366]"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold">
                        {selectedTx.category}
                      </p>
                      <p className="truncate text-[11px] text-[#636366]">
                        {selectedTx.merchant}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-full bg-black/5">
                      <span className="text-[11px] font-semibold">AR</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        Alex Rahmad
                      </p>
                      <p className="text-[10px] text-[#636366]">Created by</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex size-6 items-center justify-center rounded-[7px] bg-black/5">
                      <CupertinoIcon
                        name="calendar"
                        className="size-3.5 text-[#636366]"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium">
                        {formatDate(selectedTx.date).replace(" 2026", "")}
                      </p>
                      <p className="text-[10px] text-[#636366]">at 08.00</p>
                    </div>
                  </div>
                </div>

                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    <CupertinoIcon name="wallet" className="size-2.5" />
                    Card
                  </span>
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    {selectedTx.amount > 0 ? "Income" : "Expense"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                    {selectedTx.wallet}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-black/10 px-2.5 py-1 text-[11px] font-medium text-[#636366]">
                    # No tags
                  </span>
                </div>

                <button className="flex items-center gap-2 rounded-[10px] border border-black/10 bg-[#f2f2f4] px-3.5 py-2.5">
                  <span className="flex size-[22px] items-center justify-center rounded-[6px] bg-[#1c1c1e]">
                    <CupertinoIcon name="paperclip" className="size-3 text-white" />
                  </span>
                  <span className="text-xs font-medium">Add attachment</span>
                </button>
              </div>

              <div className="rounded-[12px] bg-white px-4 py-3.5">
                <p className="mb-3 text-[11px] text-[#636366]">
                  Total {selectedTx.amount > 0 ? "income" : "expense"}{" "}
                  {formatCurrency(Math.abs(selectedTx.amount))} for last 12
                  months
                </p>
                <div className="h-[120px]">
                  {isClient ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minWidth={1}
                      minHeight={1}
                    >
                      <BarChart data={monthlyBars}>
                        <CartesianGrid
                          stroke="rgba(0,0,0,0.06)"
                          strokeDasharray="4 3"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 9, fill: "rgba(0,0,0,0.32)" }}
                        />
                        <YAxis hide />
                        <Bar
                          dataKey="total"
                          fill={selectedTx.amount > 0 ? "#30d158" : "#ff453a"}
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-[10px] bg-[#f7f7f8]" />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button className="flex size-[38px] items-center justify-center rounded-[10px] border border-black/10 bg-white">
                  <CupertinoIcon name="upload" className="size-4 text-[#636366]" />
                </button>
                <button className="relative flex size-[38px] items-center justify-center rounded-[10px] border border-black/10 bg-white">
                  <CupertinoIcon name="download" className="size-4 text-[#636366]" />
                  <span className="absolute -top-1.5 -right-1.5 rounded-[3px] bg-[#007aff] px-1 text-[7px] font-bold text-white">
                    CSV
                  </span>
                </button>
                <button className="flex size-[38px] items-center justify-center rounded-[10px] bg-[#ff453a]/10">
                  <CupertinoIcon name="close" className="size-4 text-[#ff453a]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
      />
    </main>
  );
}
