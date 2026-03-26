import { formatCompactNumber, formatCurrency } from "@/lib/formatters";
import type { DashboardSummary } from "@/types/transaction";

interface SummaryCardsProps {
  summary: DashboardSummary;
}

const cards = [
  {
    key: "totalTransactions",
    label: "Total transaksi",
    accent: "bg-slate-950 text-white",
  },
  {
    key: "totalIncome",
    label: "Total pemasukan",
    accent: "bg-emerald-50 text-emerald-900",
  },
  {
    key: "totalExpense",
    label: "Total pengeluaran",
    accent: "bg-rose-50 text-rose-900",
  },
  {
    key: "latestBalance",
    label: "Saldo terakhir",
    accent: "bg-amber-50 text-amber-900",
  },
  {
    key: "uploadedFiles",
    label: "File PDF",
    accent: "bg-sky-50 text-sky-900",
  },
] as const;

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const value =
          card.key === "totalTransactions" || card.key === "uploadedFiles"
            ? formatCompactNumber(summary[card.key])
            : formatCurrency(summary[card.key]);

        return (
          <article
            key={card.key}
            className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]"
          >
            <div
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${card.accent}`}
            >
              {card.label}
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {value}
            </p>
          </article>
        );
      })}
    </section>
  );
}
