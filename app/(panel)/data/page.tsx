"use client";

import { DataToolbar } from "@/components/data/data-toolbar";
import { DataTransactionTable } from "@/components/data/transaction-table";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { exportTransactionsCsv } from "@/lib/export";

export default function DataPage() {
  const { filteredTransactions, filters, isHydrated, setFilters } =
    useDashboardState();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Menyiapkan data...
      </div>
    );
  }

  return (
    <AppShell
      title="Data"
      subtitle="Full transaction table dengan toolbar, filter, dan export state."
      actions={
        <Button
          onClick={() => exportTransactionsCsv(filteredTransactions)}
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]"
        >
          Export CSV
        </Button>
      }
    >
      <div className="space-y-6">
        <DataToolbar
          search={filters.search}
          onSearchChange={(value) =>
            setFilters((current) => ({ ...current, search: value }))
          }
          type={filters.type}
          onTypeChange={(value) =>
            setFilters((current) => ({ ...current, type: value }))
          }
        />
        <DataTransactionTable transactions={filteredTransactions} />
      </div>
    </AppShell>
  );
}
