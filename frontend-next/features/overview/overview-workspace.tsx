"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  TransactionDetailDialog,
  type TransactionDetailDialogTransaction,
} from "@/components/transactions/transaction-detail-dialog";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import {
  AddWalletTopBarButton,
  AddWalletDialog,
  useWallets,
} from "@/features/wallets/wallets";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";

type OverviewTransaction = TransactionDetailDialogTransaction;

const demoTransactions: OverviewTransaction[] = [
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
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function OverviewContent({
  isClient,
  recentTransactions,
  wallets,
  onSelectTransaction,
}: {
  isClient: boolean;
  recentTransactions: OverviewTransaction[];
  wallets: ReturnType<typeof useWallets>["wallets"];
  onSelectTransaction: (transaction: OverviewTransaction) => void;
}) {
  const totalBalance = useMemo(() => {
    return wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  }, [wallets]);

  const quickActions = [
    { title: "Import Transactions", href: "/file", icon: "upload" as const },
    { title: "Add Transaction", href: "/transactions", icon: "plus" as const },
    { title: "Review Categories", href: "/categories", icon: "tag" as const },
  ];

  return (
    <div className="flex w-full flex-col gap-4 px-3 pt-[60px] pb-4">
      {/* Wallet Balances Section */}
      <section className="space-y-3">
        {/* Total Balance Card */}
        <div className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
          <p className="text-[11px] text-tertiary">Total Balance</p>
          <p className="mt-3 text-3xl font-bold text-primary">
            {formatCurrency(totalBalance)}
          </p>
          <p className="mt-1 text-[11px] text-secondary">
            {wallets.length} wallet{wallets.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Individual Wallets */}
        {wallets.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="rounded-[15px] border border-subtle bg-surface p-[14px] shadow-[0_5px_15px_rgba(15,23,42,0.02)] dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-tertiary uppercase tracking-wide">
                      {wallet.name}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-primary">
                      {formatCurrency(wallet.balance)}
                    </p>
                  </div>
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-xs font-bold text-white"
                    style={{ backgroundColor: wallet.color }}
                  >
                    {wallet.abbr}
                  </div>
                </div>
                <p className="mt-2 text-[9px] text-secondary">
                  {wallet.institution}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="rounded-[20px] border border-subtle bg-surface p-[18px] shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
        <h2 className="text-[13px] font-semibold text-primary">Quick Actions</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Button
              key={action.title}
              variant="outline"
              className="h-10 justify-start rounded-[9px] border-strong bg-surface-muted px-3 text-xs shadow-none hover:bg-surface-raised"
              render={<Link href={action.href} />}
            >
              <CupertinoIcon name={action.icon} className="size-3.5 mr-2" />
              {action.title}
            </Button>
          ))}
        </div>
      </section>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <section className="overflow-hidden rounded-[20px] border border-subtle bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none">
          <div className="flex flex-wrap items-center gap-2 border-b border-subtle px-[18px] py-3.5">
            <div>
              <h2 className="text-[13px] font-semibold">Recent Transactions</h2>
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
            columnsClassName="grid-cols-[70px_minmax(0,1.2fr)_minmax(0,1fr)_110px_118px_34px]"
            minWidthClassName="min-w-[720px]"
            headers={[
              { key: "date", label: "Date" },
              { key: "merchant", label: "Merchant" },
              { key: "note", label: "Note" },
              { key: "amount", label: "Amount" },
              { key: "wallet", label: "Wallet" },
              { key: "open", label: "" },
            ]}
            hasRows={recentTransactions.length > 0}
          >
            {recentTransactions.slice(0, 5).map((transaction) => (
              <button
                key={transaction.id}
                className={cn(
                  "grid w-full grid-cols-[70px_minmax(0,1.2fr)_minmax(0,1fr)_110px_118px_34px] items-center gap-3 px-[18px] text-left transition hover:bg-surface-muted",
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
                  {transaction.wallet}
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
        </section>
      )}
    </div>
  );
}

export function OverviewWorkspace() {
  const { state } = useFileWorkspace();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const { wallets, activeWallet } = useWallets();
  const [selectedTx, setSelectedTx] = useState<OverviewTransaction | null>(
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

  const importedTransactions = useMemo<OverviewTransaction[]>(() => {
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
        title="Overview"
        variant="fixed"
        actions={
          <AddWalletTopBarButton
            onClick={() => setIsWalletDialogOpen(true)}
          />
        }
      />

      <OverviewContent
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
