"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Download,
  Search,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { FilterCard } from "@/components/filter-card";
import { FilterDropdown } from "@/components/filter-dropdown";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  { id: "bank_summary", label: "Bank summary" },
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

  const processedFiles = useMemo(
    () => state.files.filter((file) => file.status === "processed"),
    [state.files],
  );

  const processedFileMap = useMemo(
    () => new Map(processedFiles.map((file) => [file.name, file])),
    [processedFiles],
  );

  const processedTransactions = useMemo(
    () =>
      state.transactions
        .filter((transaction) => processedFileMap.has(transaction.sourceFile))
        .sort((a, b) => a.date.localeCompare(b.date)),
    [processedFileMap, state.transactions],
  );

  const processedTransactionEntries = useMemo(
    () =>
      processedTransactions.map((transaction) => ({
        transaction,
        bank: processedFileMap.get(transaction.sourceFile)?.bank ?? "-",
        category: matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        ),
      })),
    [
      processedFileMap,
      processedTransactions,
      state.categories,
      state.merchantMappings,
    ],
  );

  const filteredEntries = useMemo(() => {
    let nextEntries = processedTransactionEntries;
    const query = search.trim().toLowerCase();

    if (query) {
      nextEntries = nextEntries.filter(({ transaction, bank, category }) =>
        `${transaction.description} ${transaction.sourceFile} ${bank} ${category?.name ?? ""}`
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
      nextEntries = nextEntries.filter(({ bank }) => bank === bankFilter);
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
    processedTransactionEntries,
    search,
    typeFilter,
  ]);

  const filteredTransactions = useMemo(
    () => filteredEntries.map((item) => item.transaction),
    [filteredEntries],
  );

  const filteredSourceFiles = useMemo(
    () => new Set(filteredTransactions.map((transaction) => transaction.sourceFile)),
    [filteredTransactions],
  );

  const filteredFiles = useMemo(
    () => processedFiles.filter((file) => filteredSourceFiles.has(file.name)),
    [filteredSourceFiles, processedFiles],
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
      processedFiles: filteredFiles.length,
      processedTransactions: filteredTransactions.length,
      income,
      expense,
      net: income - expense,
      latestBalance,
    };
  }, [filteredFiles.length, filteredTransactions]);

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
      const sourceFile = processedFileMap.get(transaction.sourceFile);
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
  }, [filteredTransactions, processedFileMap]);

  const bankRows = useMemo(() => {
    const map = new Map<string, { bank: string; fileCount: number; transactionCount: number }>();

    for (const file of filteredFiles) {
      const current = map.get(file.bank) ?? {
        bank: file.bank,
        fileCount: 0,
        transactionCount: 0,
      };

      current.fileCount += 1;
      current.transactionCount += file.transactionCount;
      map.set(file.bank, current);
    }

    return [...map.values()].sort((a, b) => b.transactionCount - a.transactionCount);
  }, [filteredFiles]);

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
      icon: ArrowUpCircle,
      className: "border-emerald-200/80 bg-emerald-400/40",
      iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
    },
    {
      title: "Total expense",
      value: formatCurrency(summary.expense),
      note: "Akumulasi debit",
      icon: ArrowDownCircle,
      className: "border-rose-200/80 bg-rose-400/40",
      iconClassName: "bg-rose-100 text-rose-500 ring-rose-200/80",
    },
    {
      title: "Net flow",
      value: formatCurrency(summary.net),
      note: "Selisih income dan expense",
      icon: Wallet,
      className: "border-amber-200/80 bg-amber-400/40",
      iconClassName: "bg-amber-100 text-amber-600 ring-amber-200/80",
    },
    {
      title: "Latest balance",
      value: formatCurrency(summary.latestBalance),
      note: "Saldo terakhir yang tersedia",
      icon: BarChart3,
      className: "border-violet-200/80 bg-violet-400/40",
      iconClassName: "bg-violet-100 text-violet-500 ring-violet-200/80",
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
      { value: "all", label: "Semua bank" },
      ...[...new Set(processedTransactionEntries.map((item) => item.bank))]
        .sort((a, b) => a.localeCompare(b))
        .map((bank) => ({
          value: bank,
          label: bank,
        })),
    ],
    [processedTransactionEntries],
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
      processedTransactionEntries.some((item) => item.category === null)
    ) {
      options.push({
        value: "uncategorized",
        label: "Uncategorized",
      });
    }

    return options;
  }, [processedTransactionEntries, state.categories]);

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
      toast("Belum ada data processed untuk diexport ke PDF.");
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
    <main className="flex-1">
      <div
        ref={printRef}
        data-report-export-root="true"
        className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8"
      >
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList data-print-hidden="true">
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Reports
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Ringkasan laporan dari file yang sudah processed, lengkap
                dengan grafik performa dan tabel bulanan yang siap diexport.
              </p>
            </div>
            <div
              className="flex flex-wrap items-center gap-2"
              data-print-hidden="true"
            >
              <Button onClick={exportPdf} className="h-10 gap-2 px-4">
                <Download className="size-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </section>

        <Separator data-print-hidden="true" />

        <section data-print-hidden="true">
          <FilterCard>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari deskripsi, file, bank, atau kategori"
                    className="border-border bg-background pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Period
                </label>
                <FilterDropdown
                  value={period}
                  placeholder="Semua periode"
                  options={periodOptions}
                  onChange={setPeriod}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Transaction type
                </label>
                <FilterDropdown
                  value={typeFilter}
                  placeholder="Semua tipe"
                  options={typeOptions}
                  onChange={(value) =>
                    setTypeFilter(value as "all" | TransactionType)
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Bank
                </label>
                <FilterDropdown
                  value={bankFilter}
                  placeholder="Semua bank"
                  options={bankFilterOptions}
                  onChange={setBankFilter}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <FilterDropdown
                  value={categoryFilter}
                  placeholder="Semua kategori"
                  options={categoryFilterOptions}
                  onChange={setCategoryFilter}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Month from
                </label>
                <Input
                  type="month"
                  value={monthFrom}
                  onChange={(event) => setMonthFrom(event.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Month to
                </label>
                <Input
                  type="month"
                  value={monthTo}
                  onChange={(event) => setMonthTo(event.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Report items
              </label>
              <div className="flex flex-wrap gap-2">
                {REPORT_ITEM_OPTIONS.map((item) => {
                  const selected = visibleReportItemSet.has(item.id);

                  return (
                    <Button
                      key={item.id}
                      type="button"
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => toggleVisibleReportItem(item.id)}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={selectAllReportItems}
                >
                  Select all
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={clearReportItems}
                >
                  Clear all
                </Button>
                <p className="text-xs text-muted-foreground">
                  {visibleReportItems.length}/{REPORT_ITEM_OPTIONS.length} item
                  dipilih. Hanya item ini yang tampil dan ikut export PDF.
                </p>
              </div>
            </div>
          </FilterCard>
        </section>

        {showSummaryCards ? (
          <section
            data-print-summary="true"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {cardItems.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  data-print-card="true"
                  className={item.className}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardDescription>{item.title}</CardDescription>
                        <CardTitle className="mt-1 text-2xl">{item.value}</CardTitle>
                      </div>
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl ring-1 ${item.iconClassName}`}
                      >
                        <Icon className="size-4" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground">
                    {item.note}
                  </CardContent>
                </Card>
              );
            })}
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
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Monthly cash flow</CardTitle>
                      <CardDescription>
                        Perbandingan income dan expense per bulan untuk data
                        processed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || monthlyRows.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data processed yang cukup untuk divisualisasikan.
                        </div>
                      ) : (
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={monthlyRows}
                              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
                              <Legend />
                              <Bar
                                dataKey="income"
                                name="Income"
                                radius={[8, 8, 0, 0]}
                                fill="rgb(52 211 153)"
                              />
                              <Bar
                                dataKey="expense"
                                name="Expense"
                                radius={[8, 8, 0, 0]}
                                fill="rgb(251 113 133)"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {visibleReportItemSet.has("daily_balance_trend") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Daily balance trend</CardTitle>
                      <CardDescription>
                        Diagram garis saldo terakhir per hari untuk data report
                        pada periode terpilih.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || dailyBalanceChart.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data saldo harian untuk divisualisasikan.
                        </div>
                      ) : (
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={dailyBalanceChart}
                              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
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
                                dot={{
                                  r: 4,
                                  fill: "rgb(129 140 248)",
                                  strokeWidth: 0,
                                }}
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
                    </CardContent>
                  </Card>
                ) : null}

                {visibleReportItemSet.has("monthly_report_table") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Monthly report table</CardTitle>
                      <CardDescription>
                        Rekap per bulan untuk file count, transaction count,
                        income, expense, net, dan saldo akhir.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bulan</TableHead>
                            <TableHead>Files</TableHead>
                            <TableHead>Transactions</TableHead>
                            <TableHead>Income</TableHead>
                            <TableHead>Expense</TableHead>
                            <TableHead>Net</TableHead>
                            <TableHead>Closing balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {!isHydrated || monthlyRows.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="py-10 text-center text-muted-foreground"
                              >
                                {!isHydrated
                                  ? "Memuat data report..."
                                  : "Belum ada data processed untuk ditampilkan."}
                              </TableCell>
                            </TableRow>
                          ) : null}
                          {[...monthlyRows].reverse().map((row) => (
                            <TableRow key={row.monthKey}>
                              <TableCell>{row.monthLabel}</TableCell>
                              <TableCell>{row.fileCount}</TableCell>
                              <TableCell>{row.transactionCount}</TableCell>
                              <TableCell>{formatCurrency(row.income)}</TableCell>
                              <TableCell>{formatCurrency(row.expense)}</TableCell>
                              <TableCell>{formatCurrency(row.net)}</TableCell>
                              <TableCell>{formatCurrency(row.closingBalance)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                ) : null}

                {visibleReportItemSet.has("expense_by_category") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Expense by category</CardTitle>
                      <CardDescription>
                        Pengeluaran berdasarkan kategori untuk periode yang
                        dipilih.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || expenseCategoryRows.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data pengeluaran per kategori.
                        </div>
                      ) : (
                        <div className="h-92 w-full">
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
                              <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                                {expenseCategoryRows.map((row) => (
                                  <Cell key={row.name} fill={row.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {visibleRightReportItems.length > 0 ? (
              <div
                data-print-column={hasTwoReportColumns ? "true" : undefined}
                className="space-y-6"
              >
                {visibleReportItemSet.has("debit_credit_composition") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Debit vs credit composition</CardTitle>
                      <CardDescription>
                        Komposisi nominal expense dan income dari data final.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || pieData.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada komposisi transaksi processed.
                        </div>
                      ) : (
                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={60}
                                outerRadius={92}
                                paddingAngle={4}
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
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {visibleReportItemSet.has("bank_summary") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Bank summary</CardTitle>
                      <CardDescription>
                        Kontribusi transaksi dan jumlah file processed per bank.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || bankRows.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data bank untuk divisualisasikan.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={bankRows}
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
                                  radius={[0, 8, 8, 0]}
                                  fill="rgb(167 139 250)"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bank</TableHead>
                                <TableHead>Files</TableHead>
                                <TableHead>Transactions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {bankRows.map((row) => (
                                <TableRow key={row.bank}>
                                  <TableCell>{row.bank}</TableCell>
                                  <TableCell>{row.fileCount}</TableCell>
                                  <TableCell>{row.transactionCount}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {visibleReportItemSet.has("income_by_category") ? (
                  <Card data-print-card="true" className="border-border bg-card">
                    <CardHeader>
                      <CardTitle>Income by category</CardTitle>
                      <CardDescription>
                        Pendapatan berdasarkan kategori untuk periode yang
                        dipilih.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!isHydrated || incomeCategoryRows.length === 0 ? (
                        <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                          Belum ada data pemasukan per kategori.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={incomeCategoryRows}
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
                                <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                                  {incomeCategoryRows.map((row) => (
                                    <Cell key={row.name} fill={row.fill} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Category</TableHead>
                                <TableHead>Income</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {incomeCategoryRows.map((row) => (
                                <TableRow key={row.name}>
                                  <TableCell>{row.name}</TableCell>
                                  <TableCell>{formatCurrency(row.total)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {!showSummaryCards && !hasVisibleMainSections ? (
          <Card className="border-border bg-card">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Pilih minimal satu item report di panel Filters untuk menampilkan
              isi halaman dan export PDF.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
