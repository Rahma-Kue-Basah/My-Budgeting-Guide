"use client";

import { Download, FileSpreadsheet, Layers3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { exportSummaryCsv, exportTransactionsCsv } from "@/lib/export";

const exportOptions = [
  {
    title: "Export transaksi CSV",
    description: "Unduh seluruh transaksi dalam format flat dan mudah dianalisis.",
    kind: "transactions",
    icon: FileSpreadsheet,
  },
  {
    title: "Export ringkasan",
    description: "Simpan metrik utama dashboard ke file ringkasan terpisah.",
    kind: "summary",
    icon: Layers3,
  },
] as const;

export default function ExportPage() {
  const { filteredTransactions, isHydrated, summary } = useDashboardState();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Menyiapkan data...
      </div>
    );
  }

  return (
    <AppShell
      title="Export"
      subtitle="Pilih format keluaran untuk kebutuhan analisis dan reporting."
      actions={
        <Button
          onClick={() => exportTransactionsCsv(filteredTransactions)}
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]"
        >
          <Download className="size-4" />
          Start export
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {exportOptions.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="rounded-[24px] border-white/70 bg-white/85">
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(56,189,248,0.12))] text-violet-700">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="mt-4">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                <Button
                  onClick={() =>
                    item.kind === "summary"
                      ? exportSummaryCsv(summary)
                      : exportTransactionsCsv(filteredTransactions)
                  }
                  variant="outline"
                  className="mt-5 h-11 rounded-2xl border-slate-200 bg-white"
                >
                  Pilih format
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
