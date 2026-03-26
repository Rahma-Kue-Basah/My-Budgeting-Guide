"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Landmark,
  WalletCards,
} from "lucide-react";
import { HeroPanel } from "@/components/dashboard/hero-panel";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentFiles } from "@/components/dashboard/recent-files";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardPage() {
  const { filteredTransactions, isHydrated, resetAllData, storedState, summary } =
    useDashboardState();
  const icons = [WalletCards, ArrowUpCircle, ArrowDownCircle, Landmark] as const;

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Menyiapkan data...
      </div>
    );
  }

  const summaryMetrics = [
    {
      label: "Total transaksi",
      value: summary.totalTransactions.toLocaleString("id-ID"),
      note: `${storedState.uploadedFiles.length} file aktif di workspace`,
      accent: "from-violet-500/18 via-fuchsia-500/10 to-transparent",
    },
    {
      label: "Total pemasukan",
      value: formatCurrency(summary.totalIncome),
      note: "Akumulasi transaksi credit",
      accent: "from-cyan-500/18 via-sky-500/10 to-transparent",
    },
    {
      label: "Total pengeluaran",
      value: formatCurrency(summary.totalExpense),
      note: "Akumulasi transaksi debit",
      accent: "from-pink-500/18 via-rose-500/10 to-transparent",
    },
    {
      label: "Saldo akhir",
      value: formatCurrency(summary.latestBalance),
      note: "Saldo terakhir yang terbaca dari PDF",
      accent: "from-indigo-500/18 via-violet-500/10 to-transparent",
    },
  ] as const;

  return (
    <AppShell
      title="Dashboard"
      subtitle="Workspace mutasi rekening dengan nuansa creator finance dashboard."
      actions={
        <>
          <Button
            variant="outline"
            onClick={resetAllData}
            className="h-11 rounded-2xl border-white/70 bg-white/75 px-4 shadow-[0_10px_20px_rgba(15,23,42,0.04)]"
          >
            Reset data
          </Button>
          <Button className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]">
            Upload PDF
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <HeroPanel />

        <section className="grid gap-4 xl:grid-cols-4">
          {summaryMetrics.map((metric, index) => {
            const Icon = icons[index];

            return (
              <SummaryCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                note={metric.note}
                icon={Icon}
                accentClass={metric.accent}
              />
            );
          })}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <QuickActions />
          <RecentFiles files={storedState.uploadedFiles} />
        </div>

        <RecentTransactions transactions={filteredTransactions} />
      </div>
    </AppShell>
  );
}
