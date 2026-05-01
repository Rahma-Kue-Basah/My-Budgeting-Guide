"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export type TransactionDetailDialogTransaction = {
  id: string;
  date: string;
  merchant: string;
  note: string;
  category: string;
  wallet: string;
  amount: number;
  createdBy: string;
};

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

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TransactionDetailDialog({
  transaction,
  open,
  onOpenChange,
  showHistoryChart = false,
}: {
  transaction: TransactionDetailDialogTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showHistoryChart?: boolean;
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!open || !transaction) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--text-primary)_30%,transparent)] p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="liquid-modal w-full max-w-[460px] overflow-hidden rounded-[20px]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="relative flex items-center justify-center px-5 pt-[18px] pb-3">
            <span className="text-[15px] font-semibold">Transaction</span>
            <button
              className="absolute top-3.5 right-4 flex size-7 items-center justify-center rounded-full bg-black/6 dark:bg-white/10"
              onClick={() => onOpenChange(false)}
            >
              <CupertinoIcon
                name="close"
                className="size-3.5 text-secondary"
              />
            </button>
          </div>

          <div className="flex flex-col gap-2.5 px-4 pb-5">
            <div className="rounded-[12px] bg-white/50 px-4 py-3 dark:bg-white/7">
              <p className="mb-1.5 text-[11px] text-secondary">Amount</p>
              <p
                className={cn(
                  "text-[26px] font-bold",
                  transaction.amount > 0 ? "text-success" : "text-primary",
                )}
              >
                {transaction.amount > 0 ? "+" : "-"}
                {formatCurrency(Math.abs(transaction.amount))}
              </p>
            </div>

            <div className="rounded-[12px] bg-white/50 px-4 py-3 dark:bg-white/7">
              <p className="mb-1.5 text-[11px] text-secondary">Your note</p>
              <p className="text-[13px] text-primary">
                {transaction.note || "Add note"}
              </p>
            </div>

            <div className="rounded-[12px] bg-white/50 px-4 py-3.5 dark:bg-white/7">
              <div className="mb-3.5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-[8px] bg-white/60 dark:bg-white/10">
                    <CupertinoIcon
                      name="wallet"
                      className="size-4 text-secondary"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">
                      {transaction.category}
                    </p>
                    <p className="truncate text-[11px] text-secondary">
                      {transaction.merchant}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-full bg-surface-raised">
                    <span className="text-[11px] font-semibold">
                      {getInitials(transaction.createdBy)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">
                      {transaction.createdBy}
                    </p>
                    <p className="text-[10px] text-secondary">Created by</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded-[7px] bg-surface-raised">
                    <CupertinoIcon
                      name="calendar"
                      className="size-3.5 text-secondary"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium">
                      {formatDate(transaction.date).replace(" 2026", "")}
                    </p>
                    <p className="text-[10px] text-secondary">at 08.00</p>
                  </div>
                </div>
              </div>

              <div className="mb-3.5 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <CupertinoIcon name="wallet" className="size-2.5" />
                  Card
                </span>
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  {transaction.amount > 0 ? "Income" : "Expense"}
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
                  {transaction.wallet}
                </span>
                <span className="inline-flex items-center rounded-full border border-strong px-2.5 py-1 text-[11px] font-medium text-secondary">
                  # No tags
                </span>
              </div>

              <button className="flex items-center gap-2 rounded-[10px] border border-strong bg-surface-muted px-3.5 py-2.5">
                <span className="flex size-[22px] items-center justify-center rounded-[6px] bg-[var(--text-primary)]">
                  <CupertinoIcon name="paperclip" className="size-3 text-white" />
                </span>
                <span className="text-xs font-medium">Add attachment</span>
              </button>
            </div>

            {showHistoryChart ? (
              <div className="rounded-[12px] bg-white/50 px-4 py-3.5 dark:bg-white/7">
                <p className="mb-3 text-[11px] text-secondary">
                  Total {transaction.amount > 0 ? "income" : "expense"}{" "}
                  {formatCurrency(Math.abs(transaction.amount))} for last 12
                  months
                </p>
                <div className="h-[120px] w-full">
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
                          fill={
                            transaction.amount > 0
                              ? "var(--success)"
                              : "var(--danger)"
                          }
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full rounded-[10px] bg-surface-muted" />
                  )}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-2">
              <button className="flex size-[38px] items-center justify-center rounded-[10px] border border-strong bg-white/50 dark:bg-white/7">
                <CupertinoIcon
                  name="upload"
                  className="size-4 text-secondary"
                />
              </button>
              <button className="relative flex size-[38px] items-center justify-center rounded-[10px] border border-strong bg-white/50 dark:bg-white/7">
                <CupertinoIcon
                  name="download"
                  className="size-4 text-secondary"
                />
                <span className="absolute -top-1.5 -right-1.5 rounded-[3px] bg-[var(--accent)] px-1 text-[7px] font-bold text-white">
                  CSV
                </span>
              </button>
              <button className="flex size-[38px] items-center justify-center rounded-[10px] bg-danger/10">
                <CupertinoIcon name="close" className="size-4 text-danger" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
