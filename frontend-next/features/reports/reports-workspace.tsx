"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Download,
} from "lucide-react";
import { toast } from "sonner";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  matchTransactionCategory,
} from "@/lib/categories";
import {
  CHART_AXIS_TICK,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_STYLE,
  getCategoryChartColor,
} from "@/lib/charts";
import { Button } from "@/components/ui/button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { Input } from "@/components/ui/input";
import {
  formatCompactNumber,
  formatCurrency,
  formatMonthLabel,
} from "@/lib/formatters";
import type { TransactionType } from "@/types/transaction";

type MonthlyReportRow = {
  monthKey: string;
  monthLabel: string;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
  fileCount: number;
  closingBalance: number | null;
};

type ReportItemId =
  | "summary_cards"
  | "monthly_cash_flow"
  | "daily_balance_trend"
  | "monthly_report_table"
  | "expense_by_category"
  | "debit_credit_composition"
  | "bank_summary"
  | "income_by_category";

const REPORT_ITEM_OPTIONS: { id: ReportItemId; label: string }[] = [
  { id: "summary_cards", label: "Summary cards" },
  { id: "monthly_cash_flow", label: "Monthly cash flow" },
  { id: "daily_balance_trend", label: "Daily balance trend" },
  { id: "monthly_report_table", label: "Monthly report table" },
  { id: "expense_by_category", label: "Expense by category" },
  { id: "debit_credit_composition", label: "Debit vs credit composition" },
  { id: "bank_summary", label: "Source summary" },
  { id: "income_by_category", label: "Income by category" },
];

const DEFAULT_REPORT_ITEMS = REPORT_ITEM_OPTIONS.map((item) => item.id);
const LEFT_REPORT_ITEMS: ReportItemId[] = [
  "monthly_cash_flow",
  "daily_balance_trend",
  "monthly_report_table",
  "expense_by_category",
];
const RIGHT_REPORT_ITEMS: ReportItemId[] = [
  "debit_credit_composition",
  "bank_summary",
  "income_by_category",
];

function buildFallbackMonthKey(value: string) {
  return value.slice(0, 7);
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: "download" | "upload" | "wallet" | "database";
}) {
  return (
    <div className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.02em] text-[#8e8e93]">
            {title}
          </p>
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-[#1c1c1e] dark:text-[#f2f2f7]">
            {value}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#f2f2f4] dark:bg-[#3a3a3c]">
          <CupertinoIcon name={icon} className="size-4 text-[#636366] dark:text-[#8e8e93]" />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[#8e8e93]">{description}</p>
    </div>
  );
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[320px] items-center justify-center rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] dark:bg-[#2c2c2e] px-4 text-center text-sm text-[#8e8e93]">
      {message}
    </div>
  );
}

function ChartLegend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#8e8e93]">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function ReportsWorkspace() {
  const { state, isHydrated } = useFileWorkspace();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [period, setPeriod] = useState("all");
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [visibleReportItems, setVisibleReportItems] =
    useState<ReportItemId[]>(DEFAULT_REPORT_ITEMS);
  const printRef = useRef<HTMLDivElement>(null);

  const fileMap = useMemo(
    () => new Map(state.files.map((file) => [file.name, file])),
    [state.files],
  );

  const transactionEntries = useMemo(
    () =>
      [...state.transactions]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((transaction) => {
          const sourceFile = fileMap.get(transaction.sourceFile) ?? null;

          return {
        transaction,
            source: sourceFile?.bank ?? "Manual",
            sourceKind: sourceFile ? "import" : "manual",
            category: matchTransactionCategory(
              transaction,
              state.categories,
              state.merchantMappings,
            ),
          };
        }),
    [
      fileMap,
      state.categories,
      state.merchantMappings,
      state.transactions,
    ],
  );

  const filteredEntries = useMemo(() => {
    let nextEntries = transactionEntries;
    const query = search.trim().toLowerCase();

    if (query) {
      nextEntries = nextEntries.filter(({ transaction, source, category }) =>
        `${transaction.description} ${transaction.sourceFile} ${source} ${category?.name ?? ""}`
          .toLowerCase()
          .includes(query),
      );
    }

    if (period !== "all") {
      const now = new Date();
      const start = new Date(now);

      if (period === "last_30_days") {
        start.setDate(now.getDate() - 30);
      } else if (period === "last_3_months") {
        start.setMonth(now.getMonth() - 3);
      } else if (period === "this_year") {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
      }

      const startTime = start.getTime();

      nextEntries = nextEntries.filter(
        ({ transaction }) => new Date(transaction.date).getTime() >= startTime,
      );
    }

    if (monthFrom) {
      nextEntries = nextEntries.filter(
        ({ transaction }) => transaction.date.slice(0, 7) >= monthFrom,
      );
    }

    if (monthTo) {
      nextEntries = nextEntries.filter(
        ({ transaction }) => transaction.date.slice(0, 7) <= monthTo,
      );
    }

    if (typeFilter !== "all") {
      nextEntries = nextEntries.filter(
        ({ transaction }) => transaction.type === typeFilter,
      );
    }

    if (bankFilter !== "all") {
      nextEntries = nextEntries.filter(({ source }) => source === bankFilter);
    }

    if (categoryFilter !== "all") {
      nextEntries = nextEntries.filter(({ category }) =>
        categoryFilter === "uncategorized"
          ? category === null
          : category?.id === categoryFilter,
      );
    }

    return nextEntries;
  }, [
    bankFilter,
    categoryFilter,
    monthFrom,
    monthTo,
    period,
    transactionEntries,
    search,
    typeFilter,
  ]);

  const filteredTransactions = useMemo(
    () => filteredEntries.map((item) => item.transaction),
    [filteredEntries],
  );

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    let latestBalance: number | null = null;

    for (const transaction of filteredTransactions) {
      if (transaction.type === "credit") {
        income += transaction.amount;
      } else {
        expense += transaction.amount;
      }

      if (transaction.balance !== null) {
        latestBalance = transaction.balance;
      }
    }

    return {
      totalSources: new Set(
        filteredEntries.map((item) => item.source),
      ).size,
      totalTransactions: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
      latestBalance,
    };
  }, [filteredEntries, filteredTransactions]);

  const categorizedTransactions = useMemo(
    () => filteredEntries,
    [filteredEntries],
  );

  const monthlyRows = useMemo<MonthlyReportRow[]>(() => {
    const map = new Map<
      string,
      {
        monthLabel: string;
        income: number;
        expense: number;
        transactionCount: number;
        fileNames: Set<string>;
        closingBalance: number | null;
        sortValue: string;
      }
    >();

    for (const transaction of filteredTransactions) {
      const sourceFile = fileMap.get(transaction.sourceFile);
      const fallbackMonthKey = buildFallbackMonthKey(transaction.date);
      const monthKey = sourceFile?.statementPeriod ?? fallbackMonthKey;
      const current = map.get(monthKey) ?? {
        monthLabel: sourceFile?.statementPeriod ?? formatMonthLabel(fallbackMonthKey),
        income: 0,
        expense: 0,
        transactionCount: 0,
        fileNames: new Set<string>(),
        closingBalance: null,
        sortValue: transaction.date,
      };

      if (transaction.type === "credit") {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }

      current.transactionCount += 1;
      current.fileNames.add(transaction.sourceFile);

      if (transaction.balance !== null) {
        current.closingBalance = transaction.balance;
      }

      if (transaction.date < current.sortValue) {
        current.sortValue = transaction.date;
      }

      map.set(monthKey, current);
    }

    return [...map.entries()]
      .sort((a, b) => a[1].sortValue.localeCompare(b[1].sortValue))
      .map(([monthKey, value]) => ({
        monthKey,
        monthLabel: value.monthLabel,
        income: value.income,
        expense: value.expense,
        net: value.income - value.expense,
        transactionCount: value.transactionCount,
        fileCount: value.fileNames.size,
        closingBalance: value.closingBalance,
      }));
  }, [filteredTransactions, fileMap]);

  const bankRows = useMemo(() => {
    const map = new Map<string, { bank: string; fileCount: number; transactionCount: number }>();
    const transactionCountBySource = new Map<string, number>();
    const importFileNamesBySource = new Map<string, Set<string>>();

    for (const item of filteredEntries) {
      transactionCountBySource.set(
        item.source,
        (transactionCountBySource.get(item.source) ?? 0) + 1,
      );

      if (item.sourceKind === "import") {
        const fileNames = importFileNamesBySource.get(item.source) ?? new Set<string>();
        fileNames.add(item.transaction.sourceFile);
        importFileNamesBySource.set(item.source, fileNames);
      }
    }

    for (const [bank, transactionCount] of transactionCountBySource.entries()) {
      map.set(bank, {
        bank,
        fileCount: importFileNamesBySource.get(bank)?.size ?? 0,
        transactionCount,
      });
    }

    return [...map.values()].sort((a, b) => b.transactionCount - a.transactionCount);
  }, [filteredEntries]);

  const pieData = useMemo(
    () => [
      { name: "Credit", value: summary.income, fill: "rgb(52 211 153)" },
      { name: "Debit", value: summary.expense, fill: "rgb(251 113 133)" },
    ].filter((item) => item.value > 0),
    [summary.expense, summary.income],
  );

  const dailyBalanceChart = useMemo(() => {
    const balanceByDay = new Map<string, { label: string; balance: number }>();

    for (const transaction of filteredTransactions) {
      if (transaction.balance === null) {
        continue;
      }

      const dayKey = transaction.date.slice(0, 10);
      balanceByDay.set(dayKey, {
        label: new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
        }).format(new Date(transaction.date)),
        balance: transaction.balance,
      });
    }

    return [...balanceByDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => value)
      .filter((item) => item.balance !== 0);
  }, [filteredTransactions]);

  const expenseCategoryRows = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();

    for (const item of categorizedTransactions) {
      if (item.transaction.type !== "debit") {
        continue;
      }

      const category = item.category;
      const key = category?.id ?? "uncategorized-expense";
      const current = map.get(key) ?? {
        name: category?.name ?? "Uncategorized",
        color: category ? getCategoryChartColor(category.color) : "rgb(203 213 225)",
        total: 0,
      };

      current.total += item.transaction.amount;
      map.set(key, current);
    }

    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        ...item,
        fill: item.color,
      }));
  }, [categorizedTransactions]);

  const incomeCategoryRows = useMemo(() => {
    const map = new Map<string, { name: string; color: string; total: number }>();

    for (const item of categorizedTransactions) {
      if (item.transaction.type !== "credit") {
        continue;
      }

      const category = item.category;
      const key = category?.id ?? "uncategorized-income";
      const current = map.get(key) ?? {
        name: category?.name ?? "Uncategorized",
        color: category ? getCategoryChartColor(category.color) : "rgb(203 213 225)",
        total: 0,
      };

      current.total += item.transaction.amount;
      map.set(key, current);
    }

    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        ...item,
        fill: item.color,
      }));
  }, [categorizedTransactions]);

  const cardItems = [
    {
      title: "Total income",
      value: formatCurrency(summary.income),
      note: "Akumulasi credit",
      icon: "download" as const,
    },
    {
      title: "Total expense",
      value: formatCurrency(summary.expense),
      note: "Akumulasi debit",
      icon: "upload" as const,
    },
    {
      title: "Net flow",
      value: formatCurrency(summary.net),
      note: "Selisih income dan expense",
      icon: "wallet" as const,
    },
    {
      title: "Latest balance",
      value: formatCurrency(summary.latestBalance),
      note: "Saldo terakhir yang tersedia",
      icon: "database" as const,
    },
  ];

  const periodOptions = [
    { value: "all", label: "Semua periode" },
    { value: "last_30_days", label: "30 hari terakhir" },
    { value: "last_3_months", label: "3 bulan terakhir" },
    { value: "this_year", label: "Tahun ini" },
  ];

  const typeOptions = [
    { value: "all", label: "Semua tipe" },
    { value: "debit", label: "Debit" },
    { value: "credit", label: "Credit" },
  ];

  const bankFilterOptions = useMemo(
    () => [
      { value: "all", label: "Semua source" },
      ...[...new Set(transactionEntries.map((item) => item.source))]
        .sort((a, b) => a.localeCompare(b))
        .map((source) => ({
          value: source,
          label: source,
        })),
    ],
    [transactionEntries],
  );

  const categoryFilterOptions = useMemo(() => {
    const options = [
      { value: "all", label: "Semua kategori" },
      ...state.categories
        .map((category) => ({
          value: category.id,
          label: category.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];

    if (
      transactionEntries.some((item) => item.category === null)
    ) {
      options.push({
        value: "uncategorized",
        label: "Uncategorized",
      });
    }

    return options;
  }, [transactionEntries, state.categories]);

  const visibleReportItemSet = useMemo(
    () => new Set(visibleReportItems),
    [visibleReportItems],
  );

  const showSummaryCards = visibleReportItemSet.has("summary_cards");
  const visibleLeftReportItems = LEFT_REPORT_ITEMS.filter((item) =>
    visibleReportItemSet.has(item),
  );
  const visibleRightReportItems = RIGHT_REPORT_ITEMS.filter((item) =>
    visibleReportItemSet.has(item),
  );
  const hasVisibleMainSections =
    visibleLeftReportItems.length > 0 || visibleRightReportItems.length > 0;
  const hasTwoReportColumns =
    visibleLeftReportItems.length > 0 && visibleRightReportItems.length > 0;

  function reorderVisibleReportItems(nextItems: ReportItemId[]) {
    return DEFAULT_REPORT_ITEMS.filter((item) => nextItems.includes(item));
  }

  function toggleVisibleReportItem(itemId: ReportItemId) {
    setVisibleReportItems((current) => {
      const nextItems = current.includes(itemId)
        ? current.filter((item) => item !== itemId)
        : [...current, itemId];

      return reorderVisibleReportItems(nextItems);
    });
  }

  function selectAllReportItems() {
    setVisibleReportItems(DEFAULT_REPORT_ITEMS);
  }

  function clearReportItems() {
    setVisibleReportItems([]);
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter("all");
    setBankFilter("all");
    setCategoryFilter("all");
    setPeriod("all");
    setMonthFrom("");
    setMonthTo("");
    setVisibleReportItems(DEFAULT_REPORT_ITEMS);
  }

  function exportPdf() {
    if (visibleReportItems.length === 0) {
      toast("Pilih minimal satu item report untuk ditampilkan dan diexport.");
      return;
    }

    if (!printRef.current || monthlyRows.length === 0) {
      toast("Belum ada data transaksi workspace untuk diexport ke PDF.");
      return;
    }
    const headContent = Array.from(
      document.head.querySelectorAll('style, link[rel="stylesheet"]'),
    )
      .map((node) => node.outerHTML)
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>MBG Reports</title>
          ${headContent}
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            html, body {
              margin: 0;
              background: white;
              font-family: Arial, Helvetica, sans-serif;
            }
            body {
              padding: 0;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            }
            .report-print-shell {
              padding: 20px 24px;
              font-family: Arial, Helvetica, sans-serif;
            }
            [data-report-export-root="true"] {
              max-width: none !important;
              width: 100% !important;
              gap: 20px !important;
              padding: 0 !important;
            }
            [data-report-export-root="true"] [data-print-hidden="true"] {
              display: none !important;
            }
            [data-report-export-root="true"] [data-print-summary="true"] {
              display: grid !important;
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              gap: 12px !important;
            }
            [data-report-export-root="true"] [data-print-main-grid="true"] {
              display: grid !important;
              grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr) !important;
              gap: 20px !important;
              align-items: start !important;
            }
            [data-report-export-root="true"] [data-print-column="true"] {
              display: flex !important;
              flex-direction: column !important;
              gap: 20px !important;
            }
            [data-report-export-root="true"] [data-print-card="true"] {
              break-inside: avoid;
              page-break-inside: avoid;
            }
            [data-report-export-root="true"] .recharts-responsive-container {
              min-height: 280px !important;
            }
            [data-report-export-root="true"] table {
              font-size: 12px;
            }
            [data-report-export-root="true"] h1 {
              font-size: 30px !important;
            }
            [data-report-export-root="true"] h3,
            [data-report-export-root="true"] .text-2xl {
              font-size: 22px !important;
            }
          </style>
        </head>
        <body>
          <div class="report-print-shell">
            ${printRef.current.outerHTML}
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");

    document.body.appendChild(iframe);

    const iframeDocument =
      iframe.contentDocument ?? iframe.contentWindow?.document;

    if (!iframeDocument || !iframe.contentWindow) {
      iframe.remove();
      toast("Gagal menyiapkan dokumen PDF.");
      return;
    }

    iframeDocument.open();
    iframeDocument.write(html);
    iframeDocument.close();

    window.setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      window.setTimeout(() => {
        iframe.remove();
      }, 1000);
    }, 500);
  }

  return (
    <main className="min-h-svh flex-1 bg-[#f2f2f4] dark:bg-black text-[#1c1c1e] dark:text-[#f2f2f7]">
      <section
        className="sticky top-[58px] z-10 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] md:top-0"
        data-print-hidden="true"
      >
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#f2f2f7]">
            Reports
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              onClick={exportPdf}
              className="h-9 rounded-[9px] bg-[#1c1c1e] px-3 text-white shadow-none hover:bg-black"
            >
              <Download className="size-3.5" />
              Export PDF
            </Button>
          </div>
        </div>
      </section>

      <div
        ref={printRef}
        data-report-export-root="true"
        className="flex w-full flex-col gap-3 px-3 py-3"
      >
        <section data-print-hidden="true">
          <div className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                Report filters
              </h2>
              <p className="text-[11px] leading-5 text-[#8e8e93]">
                Atur source, periode, dan modul report yang ingin ditampilkan atau diexport.
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Search</span>
                <div className="relative">
                  <CupertinoIcon
                    name="search"
                    className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#8e8e93]"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari deskripsi, source, atau kategori"
                    className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] pl-9 shadow-none focus-visible:ring-[#007aff]/30"
                  />
                </div>
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Period</span>
                <CupertinoSelect
                  icon="calendar"
                  value={period}
                  options={periodOptions}
                  onChange={setPeriod}
                  minWidthClassName="w-full"
                  ariaLabel="Filter report period"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Type</span>
                <CupertinoSelect
                  icon="repeat"
                  value={typeFilter}
                  options={typeOptions}
                  onChange={(value) =>
                    setTypeFilter(value as "all" | TransactionType)
                  }
                  minWidthClassName="w-full"
                  ariaLabel="Filter transaction type"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Source</span>
                <CupertinoSelect
                  icon="wallet"
                  value={bankFilter}
                  options={bankFilterOptions}
                  onChange={setBankFilter}
                  minWidthClassName="w-full"
                  ariaLabel="Filter report source"
                />
              </label>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Category</span>
                <CupertinoSelect
                  icon="tag"
                  value={categoryFilter}
                  options={categoryFilterOptions}
                  onChange={setCategoryFilter}
                  minWidthClassName="w-full"
                  ariaLabel="Filter report category"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Month from</span>
                <Input
                  type="month"
                  value={monthFrom}
                  onChange={(event) => setMonthFrom(event.target.value)}
                  className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] shadow-none focus-visible:ring-[#007aff]/30"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[11px] font-medium text-[#8e8e93]">Month to</span>
                <Input
                  type="month"
                  value={monthTo}
                  onChange={(event) => setMonthTo(event.target.value)}
                  className="h-10 rounded-[10px] border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] shadow-none focus-visible:ring-[#007aff]/30"
                />
              </label>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="h-10 rounded-[10px] border-black/[0.08] bg-[#f7f7f8] px-3 text-[#1c1c1e] dark:text-[#f2f2f7] shadow-none hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
                >
                  Reset filters
                </Button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-medium text-[#8e8e93]">Report items</span>
                <CupertinoChip tone="neutral">
                  {visibleReportItems.length}/{REPORT_ITEM_OPTIONS.length} active
                </CupertinoChip>
              </div>
              <div className="flex flex-wrap gap-2">
                {REPORT_ITEM_OPTIONS.map((item) => {
                  const selected = visibleReportItemSet.has(item.id);

                  return (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant="outline"
                      className={
                        selected
                          ? "h-8 rounded-[8px] border-[#007aff]/15 bg-[#007aff]/10 px-3 text-[#007aff] shadow-none hover:bg-[#007aff]/15"
                          : "h-8 rounded-[8px] border-black/[0.08] bg-[#f7f7f8] px-3 text-[#636366] dark:text-[#8e8e93] shadow-none hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
                      }
                      onClick={() => toggleVisibleReportItem(item.id)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-[8px] border-black/[0.08] bg-[#f7f7f8] px-3 text-[#1c1c1e] dark:text-[#f2f2f7] shadow-none hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
                  onClick={selectAllReportItems}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-[8px] border-black/[0.08] bg-[#f7f7f8] px-3 text-[#1c1c1e] dark:text-[#f2f2f7] shadow-none hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]"
                  onClick={clearReportItems}
                >
                  Clear all
                </Button>
                <p className="text-[11px] text-[#8e8e93]">
                  Hanya modul yang aktif di sini yang tampil dan ikut export PDF.
                </p>
              </div>
            </div>
          </div>
        </section>

        {showSummaryCards ? (
          <section
            data-print-summary="true"
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
          >
            {cardItems.map((item) => (
              <div key={item.title} data-print-card="true">
                <SummaryCard
                  title={item.title}
                  value={item.value}
                  description={item.note}
                  icon={item.icon}
                />
              </div>
            ))}
          </section>
        ) : null}

        {hasVisibleMainSections ? (
          <div
            data-print-main-grid={hasTwoReportColumns ? "true" : undefined}
            className={
              hasTwoReportColumns
                ? "grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
                : "space-y-6"
            }
          >
            {visibleLeftReportItems.length > 0 ? (
              <div
                data-print-column={hasTwoReportColumns ? "true" : undefined}
                className="space-y-6"
              >
                {visibleReportItemSet.has("monthly_cash_flow") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Monthly cash flow</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Perbandingan income dan expense per bulan untuk data
                        workspace yang sedang aktif.
                      </p>
                    </div>
                    <div className="mt-4">
                      <ChartLegend
                        items={[
                          { label: "Income", color: "rgb(52 211 153)" },
                          { label: "Expense", color: "rgb(251 113 133)" },
                        ]}
                      />
                    </div>
                    <div className="mt-4">
                      {!isHydrated || monthlyRows.length === 0 ? (
                        <ChartEmptyState message="Belum ada data workspace yang cukup untuk divisualisasikan." />
                      ) : (
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyRows}
                              margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
                            >
                              <CartesianGrid
                                stroke={CHART_GRID_STROKE}
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="monthLabel"
                                tickLine={false}
                                axisLine={false}
                                tick={CHART_AXIS_TICK}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                width={64}
                                tick={CHART_AXIS_TICK}
                                tickFormatter={formatCompactNumber}
                              />
                              <RechartsTooltip
                                contentStyle={CHART_TOOLTIP_STYLE}
                                formatter={(value) =>
                                  typeof value === "number"
                                    ? formatCurrency(value)
                                    : "-"
                                }
                              />
                              <Bar
                                dataKey="income"
                                name="Income"
                                radius={[7, 7, 0, 0]}
                                fill="rgb(52 211 153)"
                                maxBarSize={28}
                              />
                              <Bar
                                dataKey="expense"
                                name="Expense"
                                radius={[7, 7, 0, 0]}
                                fill="rgb(251 113 133)"
                                maxBarSize={28}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}

                {visibleReportItemSet.has("daily_balance_trend") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Daily balance trend</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Diagram garis saldo terakhir per hari untuk data report
                        pada periode terpilih.
                      </p>
                    </div>
                    <div className="mt-4">
                      {!isHydrated || dailyBalanceChart.length === 0 ? (
                        <ChartEmptyState message="Belum ada data saldo harian untuk divisualisasikan." />
                      ) : (
                        <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={dailyBalanceChart}
                              margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
                            >
                              <CartesianGrid
                                stroke={CHART_GRID_STROKE}
                                strokeDasharray="3 3"
                                vertical={false}
                              />
                              <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={CHART_AXIS_TICK}
                              />
                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                width={64}
                                tick={CHART_AXIS_TICK}
                                tickFormatter={formatCompactNumber}
                              />
                              <RechartsTooltip
                                contentStyle={CHART_TOOLTIP_STYLE}
                                formatter={(value) =>
                                  typeof value === "number"
                                    ? formatCurrency(value)
                                    : "-"
                                }
                              />
                              <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="rgb(129 140 248)"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{
                                  r: 5,
                                  fill: "rgb(129 140 248)",
                                  strokeWidth: 0,
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}

                {visibleReportItemSet.has("monthly_report_table") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
                      <div className="space-y-1">
                        <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Monthly report table</h2>
                        <p className="max-w-3xl text-[11px] leading-5 text-[#8e8e93]">
                        Rekap per bulan untuk jumlah source import, transaction count,
                        income, expense, net, dan saldo akhir.
                        </p>
                      </div>
                      <CupertinoChip tone="neutral">
                        {isHydrated ? `${monthlyRows.length} months` : "Loading"}
                      </CupertinoChip>
                    </div>
                    <CupertinoTable
                      columnsClassName="grid-cols-[130px_120px_120px_130px_130px_130px_150px]"
                      minWidthClassName="min-w-[980px]"
                      headers={[
                        { key: "month", label: "Month" },
                        { key: "sources", label: "Import sources" },
                        { key: "transactions", label: "Transactions" },
                        { key: "income", label: "Income" },
                        { key: "expense", label: "Expense" },
                        { key: "net", label: "Net" },
                        { key: "balance", label: "Closing balance" },
                      ]}
                      hasRows={isHydrated && monthlyRows.length > 0}
                      emptyState={
                        <div className="px-[18px] py-10 text-center text-sm text-[#8e8e93]">
                          {!isHydrated
                            ? "Memuat data report..."
                            : "Belum ada data workspace untuk ditampilkan."}
                        </div>
                      }
                    >
                      {[...monthlyRows].reverse().map((row) => (
                        <div
                          key={row.monthKey}
                          className={`grid grid-cols-[130px_120px_120px_130px_130px_130px_150px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                        >
                          <span className="text-sm font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">{row.monthLabel}</span>
                          <span className="text-sm text-[#636366] dark:text-[#8e8e93]">{row.fileCount}</span>
                          <span className="text-sm text-[#636366] dark:text-[#8e8e93]">{row.transactionCount}</span>
                          <span className="text-sm text-[#1f8f43]">{formatCurrency(row.income)}</span>
                          <span className="text-sm text-[#ff453a]">{formatCurrency(row.expense)}</span>
                          <span className="text-sm font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{formatCurrency(row.net)}</span>
                          <span className="text-sm text-[#636366] dark:text-[#8e8e93]">{formatCurrency(row.closingBalance)}</span>
                        </div>
                      ))}
                    </CupertinoTable>
                  </section>
                ) : null}

                {visibleReportItemSet.has("expense_by_category") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Expense by category</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Pengeluaran berdasarkan kategori untuk periode yang
                        dipilih.
                      </p>
                    </div>
                    <div className="mt-4">
                      {!isHydrated || expenseCategoryRows.length === 0 ? (
                        <ChartEmptyState message="Belum ada data pengeluaran per kategori." />
                      ) : (
                        <div className="h-[368px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={expenseCategoryRows}
                              layout="vertical"
                              margin={{ top: 4, right: 8, bottom: 4, left: 8 }}
                            >
                              <CartesianGrid
                                stroke={CHART_GRID_STROKE}
                                strokeDasharray="3 3"
                                horizontal={false}
                              />
                              <XAxis
                                type="number"
                                tickLine={false}
                                axisLine={false}
                                tick={CHART_AXIS_TICK}
                                tickFormatter={formatCompactNumber}
                              />
                              <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                width={100}
                                tick={CHART_AXIS_TICK}
                              />
                              <RechartsTooltip
                                contentStyle={CHART_TOOLTIP_STYLE}
                                formatter={(value) =>
                                  typeof value === "number"
                                    ? formatCurrency(value)
                                    : "-"
                                }
                              />
                              <Bar dataKey="total" radius={[0, 7, 7, 0]} barSize={22}>
                                {expenseCategoryRows.map((row) => (
                                  <Cell key={row.name} fill={row.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            {visibleRightReportItems.length > 0 ? (
              <div
                data-print-column={hasTwoReportColumns ? "true" : undefined}
                className="space-y-6"
              >
                {visibleReportItemSet.has("debit_credit_composition") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Debit vs credit composition</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Komposisi nominal expense dan income dari data final.
                      </p>
                    </div>
                    <div className="mt-4">
                      {!isHydrated || pieData.length === 0 ? (
                        <ChartEmptyState message="Belum ada komposisi transaksi workspace." />
                      ) : (
                        <div className="space-y-4">
                          <ChartLegend
                            items={[
                              { label: "Credit", color: "rgb(52 211 153)" },
                              { label: "Debit", color: "rgb(251 113 133)" },
                            ]}
                          />
                          <div className="h-[320px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                outerRadius={96}
                                paddingAngle={3}
                                cornerRadius={6}
                              >
                                {pieData.map((entry) => (
                                  <Cell key={entry.name} fill={entry.fill} />
                                ))}
                              </Pie>
                              <RechartsTooltip
                                contentStyle={CHART_TOOLTIP_STYLE}
                                formatter={(value) =>
                                  typeof value === "number"
                                    ? formatCurrency(value)
                                    : "-"
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}

                {visibleReportItemSet.has("bank_summary") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1 px-[18px] pt-[18px]">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Source summary</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Kontribusi transaksi dan jumlah source import per sumber transaksi.
                      </p>
                    </div>
                    <div className="px-[18px] pt-4 pb-[18px]">
                      {!isHydrated || bankRows.length === 0 ? (
                        <ChartEmptyState message="Belum ada data source untuk divisualisasikan." />
                      ) : (
                        <div className="space-y-4">
                          <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={bankRows}
                                layout="vertical"
                                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                              >
                                <CartesianGrid
                                  stroke={CHART_GRID_STROKE}
                                  strokeDasharray="3 3"
                                  horizontal={false}
                                />
                                <XAxis
                                  type="number"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={CHART_AXIS_TICK}
                                />
                                <YAxis
                                  dataKey="bank"
                                  type="category"
                                  tickLine={false}
                                  axisLine={false}
                                  width={70}
                                  tick={CHART_AXIS_TICK}
                                />
                                <RechartsTooltip
                                  contentStyle={CHART_TOOLTIP_STYLE}
                                />
                                <Bar
                                  dataKey="transactionCount"
                                  name="Transactions"
                                  radius={[0, 7, 7, 0]}
                                  fill="rgb(167 139 250)"
                                  barSize={24}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="overflow-hidden rounded-[12px] border border-black/[0.05] dark:border-white/8">
                            <CupertinoTable
                              columnsClassName="grid-cols-[minmax(0,1fr)_120px_120px]"
                              minWidthClassName="min-w-[420px]"
                              headers={[
                                { key: "source", label: "Source" },
                                { key: "files", label: "Import files" },
                                { key: "transactions", label: "Transactions" },
                              ]}
                              hasRows={bankRows.length > 0}
                            >
                              {bankRows.map((row) => (
                                <div
                                  key={row.bank}
                                  className={`grid grid-cols-[minmax(0,1fr)_120px_120px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                                >
                                  <span className="truncate text-sm font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">{row.bank}</span>
                                  <span className="text-sm text-[#636366] dark:text-[#8e8e93]">{row.fileCount}</span>
                                  <span className="text-sm text-[#636366] dark:text-[#8e8e93]">{row.transactionCount}</span>
                                </div>
                              ))}
                            </CupertinoTable>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}

                {visibleReportItemSet.has("income_by_category") ? (
                  <section data-print-card="true" className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <div className="space-y-1">
                      <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Income by category</h2>
                      <p className="text-[11px] leading-5 text-[#8e8e93]">
                        Pendapatan berdasarkan kategori untuk periode yang
                        dipilih.
                      </p>
                    </div>
                    <div className="mt-4">
                      {!isHydrated || incomeCategoryRows.length === 0 ? (
                        <ChartEmptyState message="Belum ada data pemasukan per kategori." />
                      ) : (
                        <div className="space-y-4">
                          <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={incomeCategoryRows}
                                layout="vertical"
                                margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                              >
                                <CartesianGrid
                                  stroke={CHART_GRID_STROKE}
                                  strokeDasharray="3 3"
                                  horizontal={false}
                                />
                                <XAxis
                                  type="number"
                                  tickLine={false}
                                  axisLine={false}
                                  tick={CHART_AXIS_TICK}
                                  tickFormatter={formatCompactNumber}
                                />
                                <YAxis
                                  dataKey="name"
                                  type="category"
                                  tickLine={false}
                                  axisLine={false}
                                  width={100}
                                  tick={CHART_AXIS_TICK}
                                />
                                <RechartsTooltip
                                  contentStyle={CHART_TOOLTIP_STYLE}
                                  formatter={(value) =>
                                    typeof value === "number"
                                      ? formatCurrency(value)
                                      : "-"
                                  }
                                />
                                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                                  {incomeCategoryRows.map((row) => (
                                    <Cell key={row.name} fill={row.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="overflow-hidden rounded-[12px] border border-black/[0.05] dark:border-white/8">
                            <CupertinoTable
                              columnsClassName="grid-cols-[minmax(0,1fr)_140px]"
                              minWidthClassName="min-w-[360px]"
                              headers={[
                                { key: "category", label: "Category" },
                                { key: "income", label: "Income" },
                              ]}
                              hasRows={incomeCategoryRows.length > 0}
                            >
                              {incomeCategoryRows.map((row) => (
                                <div
                                  key={row.name}
                                  className={`grid grid-cols-[minmax(0,1fr)_140px] items-center gap-3 px-[18px] text-[11px] text-[#636366] dark:text-[#8e8e93] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                                >
                                  <span className="truncate text-sm font-medium text-[#1c1c1e] dark:text-[#f2f2f7]">{row.name}</span>
                                  <span className="text-sm text-[#1f8f43]">{formatCurrency(row.total)}</span>
                                </div>
                              ))}
                            </CupertinoTable>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {!showSummaryCards && !hasVisibleMainSections ? (
          <section className="rounded-[13px] border-0 bg-white dark:bg-[#1c1c1e] px-[18px] py-10 text-center text-sm text-[#8e8e93] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
              Pilih minimal satu item report di panel Filters untuk menampilkan
              isi halaman dan export PDF.
          </section>
        ) : null}
      </div>
    </main>
  );
}
