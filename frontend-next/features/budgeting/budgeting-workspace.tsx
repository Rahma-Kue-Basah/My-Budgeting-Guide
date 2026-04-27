"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  CATEGORY_COLOR_STYLES,
  matchTransactionCategory,
  sortCategoriesByPriority,
} from "@/lib/categories";
import {
  buildBudgetSuggestion,
  getCurrentMonthValue,
} from "@/lib/budgeting";
import { formatCurrency, formatMonthLabel } from "@/lib/formatters";
import type { BudgetPlan, WorkspaceCategory } from "@/types/transaction";

const LOOKBACK_OPTIONS = [
  { value: "3", label: "3 bulan terakhir" },
  { value: "6", label: "6 bulan terakhir" },
];

const SAVINGS_CATEGORY_ID = "savings";

type PlannerRow = {
  categoryId: string;
  categoryName: string;
  color: WorkspaceCategory["color"];
  recommendedAmount: number;
  lastMonthExpense: number;
  plannedAmount: number;
};

function toInputValue(value: number) {
  return String(Math.max(0, Math.round(value)));
}

function toNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric) : 0;
}

function buildPlannerRows(
  categories: WorkspaceCategory[],
  suggestion: ReturnType<typeof buildBudgetSuggestion>,
  existingPlan: BudgetPlan | null,
) {
  const suggestionMap = new Map(
    suggestion.categorySuggestions.map((item) => [item.categoryId, item]),
  );
  const existingMap = new Map(
    (existingPlan?.categoryPlans ?? []).map((item) => [item.categoryId, item.amount]),
  );

  return categories
    .sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }

      return a.name.localeCompare(b.name);
    })
    .map<PlannerRow>((category) => {
      const suggested = suggestionMap.get(category.id);
      const plannedAmount =
        existingMap.get(category.id) ??
        (category.id === SAVINGS_CATEGORY_ID
          ? existingPlan?.savingsTarget ?? 0
          : 0);

      return {
        categoryId: category.id,
        categoryName: category.name,
        color: category.color,
        recommendedAmount: suggested?.recommendedAmount ?? 0,
        lastMonthExpense: suggested?.lastMonthExpense ?? 0,
        plannedAmount,
      };
    })
    .sort(
      (a, b) =>
        Math.max(b.plannedAmount, b.recommendedAmount) -
          Math.max(a.plannedAmount, a.recommendedAmount) ||
        a.categoryName.localeCompare(b.categoryName),
    );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: "wallet" | "barChart" | "piggy" | "calendar";
}) {
  return (
    <div className="rounded-[13px] border-0 bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.02em] text-tertiary">
            {title}
          </p>
          <p className="text-[24px] font-semibold tracking-[-0.03em] text-primary">
            {value}
          </p>
        </div>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-surface-raised">
          <CupertinoIcon name={icon} className="size-4 text-secondary" />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-tertiary">{description}</p>
    </div>
  );
}

function BudgetPlanner({
  month,
  existingPlan,
  plannerRows,
  onSave,
  onDelete,
}: {
  month: string;
  existingPlan: BudgetPlan | null;
  plannerRows: PlannerRow[];
  onSave: (payload: {
    month: string;
    incomeTarget: number;
    expenseTarget: number;
    savingsTarget: number;
    categoryPlans: {
      categoryId: string;
      amount: number;
    }[];
  }) => void;
  onDelete: (month: string) => void;
}) {
  const [incomeTarget, setIncomeTarget] = useState(
    toInputValue(existingPlan?.incomeTarget ?? 0),
  );
  const [expenseTarget, setExpenseTarget] = useState(
    toInputValue(existingPlan?.expenseTarget ?? 0),
  );
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        plannerRows.map((row) => [row.categoryId, toInputValue(row.plannedAmount)]),
      ),
  );
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() =>
    plannerRows
      .filter((row) => row.plannedAmount > 0)
      .map((row) => row.categoryId),
  );
  const plannerRowMap = useMemo(
    () => new Map(plannerRows.map((row) => [row.categoryId, row])),
    [plannerRows],
  );
  const selectedRows = selectedCategoryIds
    .map((categoryId) => plannerRowMap.get(categoryId))
    .filter((row): row is PlannerRow => Boolean(row));
  const availableRows = plannerRows.filter(
    (row) => !selectedCategoryIds.includes(row.categoryId),
  );

  const incomeTargetNumber = toNumber(incomeTarget);
  const expenseTargetNumber = toNumber(expenseTarget);
  const savingsTargetNumber = selectedRows.reduce(
    (sum, row) =>
      row.categoryId === SAVINGS_CATEGORY_ID
        ? sum + toNumber(categoryInputs[row.categoryId] ?? "0")
        : sum,
    0,
  );
  const plannedExpenseTotal = selectedRows.reduce(
    (sum, row) =>
      row.categoryId === SAVINGS_CATEGORY_ID
        ? sum
        : sum + toNumber(categoryInputs[row.categoryId] ?? "0"),
    0,
  );
  const expenseGap = expenseTargetNumber - plannedExpenseTotal;
  const remainingCashflow =
    incomeTargetNumber - expenseTargetNumber - savingsTargetNumber;
  const remainingExpenseBudget = Math.max(expenseGap, 0);
  const canSuggestRemaining =
    expenseTargetNumber > 0 && selectedRows.length > 0 && remainingExpenseBudget > 0;
  const remainingSuggestionRows = useMemo(() => {
    const candidates = availableRows.filter(
      (row) =>
        row.categoryId !== SAVINGS_CATEGORY_ID && row.recommendedAmount > 0,
    );
    const totalRecommended = candidates.reduce(
      (sum, row) => sum + row.recommendedAmount,
      0,
    );

    if (candidates.length === 0 || remainingExpenseBudget <= 0) {
      return [];
    }

    return candidates
      .map((row) => ({
        ...row,
        suggestedPlanAmount:
          totalRecommended > remainingExpenseBudget
            ? Math.round(
                (row.recommendedAmount / totalRecommended) * remainingExpenseBudget,
              )
            : row.recommendedAmount,
      }))
      .filter((row) => row.suggestedPlanAmount > 0)
      .sort(
        (a, b) =>
          b.suggestedPlanAmount - a.suggestedPlanAmount ||
          b.recommendedAmount - a.recommendedAmount ||
          a.categoryName.localeCompare(b.categoryName),
      )
      .slice(0, 6);
  }, [availableRows, remainingExpenseBudget]);

  function applyRemainingSuggestions() {
    if (remainingSuggestionRows.length === 0) {
      return;
    }

    setSelectedCategoryIds((current) => [
      ...current,
      ...remainingSuggestionRows
        .map((row) => row.categoryId)
        .filter((categoryId) => !current.includes(categoryId)),
    ]);
    setCategoryInputs(
      (current) => ({
        ...current,
        ...Object.fromEntries(
          remainingSuggestionRows.map((row) => [
            row.categoryId,
            current[row.categoryId] ?? toInputValue(row.suggestedPlanAmount),
          ]),
        ),
      }),
    );
  }

  function addCategory(categoryId: string, amount?: number) {
    const row = plannerRowMap.get(categoryId);

    if (!row) {
      return;
    }

    setSelectedCategoryIds((current) =>
      current.includes(categoryId) ? current : [...current, categoryId],
    );
    setCategoryInputs((current) => ({
      ...current,
      [categoryId]:
        current[categoryId] ?? toInputValue(amount ?? row.plannedAmount),
    }));
  }

  function removeCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.filter((item) => item !== categoryId),
    );
  }

  function savePlan() {
    onSave({
      month,
      incomeTarget: incomeTargetNumber,
      expenseTarget: expenseTargetNumber,
      savingsTarget: savingsTargetNumber,
      categoryPlans: selectedRows.map((row) => ({
        categoryId: row.categoryId,
        amount: toNumber(categoryInputs[row.categoryId] ?? "0"),
      })),
    });
  }

  return (
    <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
        <div className="space-y-1">
          <h2 className="text-[13px] font-semibold text-primary">Plan editor</h2>
          <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
            Isi dulu pengeluaran wajib, lalu gunakan suggestion untuk membantu membagi sisa target expense ke kategori lain.
          </p>
        </div>
        <CupertinoChip tone={existingPlan ? "status-success" : "neutral"}>
          {existingPlan ? "Plan tersimpan" : "Belum disimpan"}
        </CupertinoChip>
      </div>

      <div className="space-y-5 px-[18px] pb-[18px]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-[11px] font-medium text-tertiary">Salary target</span>
            <Input
              inputMode="numeric"
              value={incomeTarget}
              onChange={(event) => setIncomeTarget(event.target.value)}
              className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
            />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-medium text-tertiary">Expense target</span>
            <Input
              inputMode="numeric"
              value={expenseTarget}
              onChange={(event) => setExpenseTarget(event.target.value)}
              className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
            />
          </label>
        </div>

        <p className="text-[11px] text-tertiary">
          Savings target diambil dari category Savings di tabel allocation, bukan dari input terpisah.
        </p>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[12px] bg-surface-muted px-3 py-3">
            <p className="text-[11px] font-medium text-tertiary">Planned expenses</p>
            <p className="mt-2 text-[20px] font-semibold text-primary">
              {formatCurrency(plannedExpenseTotal)}
            </p>
          </div>
          <div className="rounded-[12px] bg-surface-muted px-3 py-3">
            <p className="text-[11px] font-medium text-tertiary">Expense gap</p>
            <p className="mt-2 text-[20px] font-semibold text-primary">
              {formatCurrency(expenseGap)}
            </p>
          </div>
          <div className="rounded-[12px] bg-surface-muted px-3 py-3">
            <p className="text-[11px] font-medium text-tertiary">Savings from category</p>
            <p className="mt-2 text-[20px] font-semibold text-primary">
              {formatCurrency(savingsTargetNumber)}
            </p>
          </div>
          <div className="rounded-[12px] bg-surface-muted px-3 py-3">
            <p className="text-[11px] font-medium text-tertiary">Remaining cashflow</p>
            <p
              className={`mt-2 text-[20px] font-semibold ${remainingCashflow >= 0 ? "text-success" : "text-danger"}`}
            >
              {formatCurrency(remainingCashflow)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold text-primary">
                Required expenses first
              </p>
              <p className="text-[11px] leading-5 text-tertiary">
                Isi dulu pengeluaran wajib seperti kos, bill, transport rutin, atau cicilan. Setelah itu baru pakai suggestion untuk sisa budget.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <CupertinoActionButton tone="white" className="gap-1.5" />
                }
              >
                <Plus className="size-3.5" />
                Add category
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-[10px] border border-subtle bg-surface dark:bg-surface-muted p-1 shadow-[0_12px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] ring-0"
              >
                {availableRows.length === 0 ? (
                  <DropdownMenuItem disabled className="text-[11px] text-tertiary">
                    Semua kategori sudah dipilih
                  </DropdownMenuItem>
                ) : null}
                {availableRows.map((row) => (
                  <DropdownMenuItem
                    key={row.categoryId}
                    onClick={() => addCategory(row.categoryId)}
                    className="rounded-[8px] px-2 py-1.5 text-[13px] text-primary focus:bg-surface-muted"
                  >
                    {row.categoryName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-subtle">
            <CupertinoTable
              columnsClassName="grid-cols-[minmax(200px,1.5fr)_140px_160px_180px]"
              minWidthClassName="min-w-[760px]"
              headers={[
                { key: "category", label: "Category" },
                { key: "suggested", label: "Suggested" },
                { key: "lastRef", label: "Last reference month" },
                { key: "planned", label: "Planned" },
              ]}
              hasRows={selectedRows.length > 0}
              emptyState={
                <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                  Belum ada pengeluaran wajib di plan ini. Tambahkan dulu category yang memang harus dibayar tiap bulan.
                </div>
              }
            >
              {selectedRows.map((row) => (
                <div
                  key={row.categoryId}
                  className={`grid grid-cols-[minmax(200px,1.5fr)_140px_160px_180px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium ${CATEGORY_COLOR_STYLES[row.color].badge}`}
                    >
                      {row.categoryName}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${row.categoryName}`}
                      onClick={() => removeCategory(row.categoryId)}
                      className="flex size-6 items-center justify-center rounded-[6px] text-danger transition-colors hover:bg-danger/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <span className="font-semibold text-primary tabular-nums">
                    {formatCurrency(row.recommendedAmount)}
                  </span>
                  <span className="tabular-nums">{formatCurrency(row.lastMonthExpense)}</span>
                  <Input
                    inputMode="numeric"
                    value={categoryInputs[row.categoryId] ?? "0"}
                    onChange={(event) =>
                      setCategoryInputs((current) => ({
                        ...current,
                        [row.categoryId]: event.target.value,
                      }))
                    }
                    className="h-8 rounded-[8px] border-subtle bg-surface-muted text-[11px] shadow-none focus-visible:ring-[var(--accent)]/30"
                  />
                </div>
              ))}
            </CupertinoTable>
          </div>
        </div>

        <div className="space-y-3 rounded-[12px] bg-surface-muted p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold text-primary">Suggest the rest</p>
              <p className="text-[11px] leading-5 text-tertiary">
                Setelah pengeluaran wajib diisi, Nidhi.id bantu menyarankan category lain untuk sisa target expense yang belum teralokasi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CupertinoChip tone="neutral">
                Remaining {formatCurrency(remainingExpenseBudget)}
              </CupertinoChip>
              <CupertinoActionButton
                tone="white"
                onClick={applyRemainingSuggestions}
                disabled={!canSuggestRemaining || remainingSuggestionRows.length === 0}
              >
                Auto-fill remainder
              </CupertinoActionButton>
            </div>
          </div>

          {expenseTargetNumber <= 0 ? (
            <p className="text-[11px] text-tertiary">
              Isi Expense target dulu supaya Nidhi.id tahu sisa budget yang perlu dibantu.
            </p>
          ) : null}
          {expenseTargetNumber > 0 && selectedRows.length === 0 ? (
            <p className="text-[11px] text-tertiary">
              Tambahkan minimal satu pengeluaran wajib dulu sebelum melihat suggestion.
            </p>
          ) : null}
          {expenseTargetNumber > 0 && selectedRows.length > 0 && remainingExpenseBudget <= 0 ? (
            <p className="text-[11px] text-tertiary">
              Tidak ada sisa target expense untuk disarankan. Kurangi plan wajib atau naikkan Expense target.
            </p>
          ) : null}
          {canSuggestRemaining && remainingSuggestionRows.length === 0 ? (
            <p className="text-[11px] text-tertiary">
              Belum ada histori category lain yang cukup untuk dijadikan suggestion.
            </p>
          ) : null}

          {canSuggestRemaining && remainingSuggestionRows.length > 0 ? (
            <div className="overflow-hidden rounded-[12px] border border-subtle bg-surface">
              <CupertinoTable
                columnsClassName="grid-cols-[minmax(180px,1.5fr)_140px_160px_120px]"
                minWidthClassName="min-w-[680px]"
                headers={[
                  { key: "category", label: "Category" },
                  { key: "avg", label: "Historical avg" },
                  { key: "suggested", label: "Suggested for remainder" },
                  { key: "add", label: "Add", className: "text-right" },
                ]}
                hasRows={remainingSuggestionRows.length > 0}
              >
                {remainingSuggestionRows.map((row) => (
                  <div
                    key={`${row.categoryId}-suggestion`}
                    className={`grid grid-cols-[minmax(180px,1.5fr)_140px_160px_120px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                  >
                    <span
                      className={`inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-medium ${CATEGORY_COLOR_STYLES[row.color].badge}`}
                    >
                      {row.categoryName}
                    </span>
                    <span className="tabular-nums">{formatCurrency(row.recommendedAmount)}</span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatCurrency(row.suggestedPlanAmount)}
                    </span>
                    <div className="flex justify-end">
                      <CupertinoActionButton
                        tone="white"
                        className="h-7 px-2 text-[11px]"
                        onClick={() => addCategory(row.categoryId, row.suggestedPlanAmount)}
                      >
                        Add
                      </CupertinoActionButton>
                    </div>
                  </div>
                ))}
              </CupertinoTable>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CupertinoActionButton tone="dark" onClick={savePlan}>
            Save plan
          </CupertinoActionButton>
          {existingPlan ? (
            <CupertinoActionButton
              tone="white"
              className="text-danger hover:bg-danger/10"
              onClick={() => onDelete(month)}
            >
              Delete saved plan
            </CupertinoActionButton>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BudgetingWorkspace() {
  const {
    state,
    isHydrated,
    upsertBudgetPlan,
    deleteBudgetPlan,
  } = useFileWorkspace();
  const [targetMonth, setTargetMonth] = useState(getCurrentMonthValue);
  const [lookbackMonths, setLookbackMonths] = useState("3");

  const processedTransactions = useMemo(
    () => {
      const fileMap = new Map(state.files.map((file) => [file.name, file]));

      return state.transactions
        .map((transaction) => ({
          ...transaction,
          bank: fileMap.get(transaction.sourceFile)?.bank ?? "Manual",
          statementPeriod: fileMap.get(transaction.sourceFile)?.statementPeriod ?? null,
          category: matchTransactionCategory(
            transaction,
            state.categories,
            state.merchantMappings,
          ),
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    },
    [state.categories, state.files, state.merchantMappings, state.transactions],
  );

  const suggestion = useMemo(
    () =>
      buildBudgetSuggestion(
        processedTransactions,
        targetMonth,
        Number(lookbackMonths),
      ),
    [lookbackMonths, processedTransactions, targetMonth],
  );

  const existingPlan = useMemo(
    () => state.budgetPlans.find((plan) => plan.month === targetMonth) ?? null,
    [state.budgetPlans, targetMonth],
  );

  const plannerRows = useMemo(
    () =>
      buildPlannerRows(
        sortCategoriesByPriority(state.categories),
        suggestion,
        existingPlan,
      ),
    [existingPlan, state.categories, suggestion],
  );

  const summaryCards = [
    {
      title: "Average salary",
      value: formatCurrency(suggestion.baselineSalary),
      description:
        suggestion.baselineSalary > 0
          ? `Rata-rata kategori Salary dari ${suggestion.historyMonths.length || 0} bulan referensi`
          : "Belum ada histori kategori Salary",
      icon: "wallet" as const,
    },
    {
      title: "Average expense",
      value: formatCurrency(suggestion.baselineExpense),
      description: "Rata-rata pengeluaran bulanan",
      icon: "barChart" as const,
    },
    {
      title: "Suggested savings",
      value: formatCurrency(suggestion.baselineSavings),
      description: `${suggestion.savingsRate}% dari salary baseline`,
      icon: "piggy" as const,
    },
    {
      title: "Selected month",
      value: formatMonthLabel(targetMonth),
      description: existingPlan ? "Plan sudah tersimpan" : "Belum ada plan tersimpan",
      icon: "calendar" as const,
    },
  ];

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar title="Budgeting" />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        {!isHydrated || processedTransactions.length === 0 ? (
          <section className="rounded-[13px] border-0 bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Belum ada histori untuk budgeting
              </h2>
              <p className="text-[11px] leading-5 text-tertiary">
                Budgeting baru bisa dibuat setelah ada transaksi di workspace.
              </p>
            </div>
            <div className="mt-4">
              <Link
                href="/file"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-[9px] border border-strong bg-surface px-3 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
              >
                Buka File
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <SummaryCard
                  key={card.title}
                  title={card.title}
                  value={card.value}
                  description={card.description}
                  icon={card.icon}
                />
              ))}
            </section>

            <section className="rounded-[13px] border-0 bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
              <div className="space-y-1">
                <h2 className="text-[13px] font-semibold text-primary">
                  Planning setup
                </h2>
                <p className="text-[11px] leading-5 text-tertiary">
                  Pilih bulan target dan jumlah histori yang dipakai sebagai baseline.
                </p>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="space-y-2">
                  <span className="text-[11px] font-medium text-tertiary">Target month</span>
                  <Input
                    type="month"
                    value={targetMonth}
                    onChange={(event) =>
                      setTargetMonth(event.target.value || getCurrentMonthValue())
                    }
                    className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-[11px] font-medium text-tertiary">Baseline window</span>
                  <CupertinoSelect
                    value={lookbackMonths}
                    icon="calendar"
                    options={LOOKBACK_OPTIONS}
                    onChange={setLookbackMonths}
                    minWidthClassName="w-full"
                    ariaLabel="Baseline window"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <CupertinoChip tone="neutral">
                  Referensi:{" "}
                  {suggestion.historyMonths.length > 0
                    ? suggestion.historyMonths
                        .map((month) => formatMonthLabel(month))
                        .join(", ")
                    : "Belum ada histori referensi"}
                </CupertinoChip>
                {suggestion.uncategorizedAverageExpense > 0 ? (
                  <CupertinoChip tone="neutral">
                    Avg uncategorized {formatCurrency(suggestion.uncategorizedAverageExpense)}
                  </CupertinoChip>
                ) : null}
              </div>
            </section>

            <BudgetPlanner
              key={`${targetMonth}-${lookbackMonths}-${existingPlan?.updatedAt ?? "new"}`}
              month={targetMonth}
              existingPlan={existingPlan}
              plannerRows={plannerRows}
              onSave={upsertBudgetPlan}
              onDelete={deleteBudgetPlan}
            />

            <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
              <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
                <div className="space-y-1">
                  <h2 className="text-[13px] font-semibold text-primary">
                    Monthly baseline history
                  </h2>
                  <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                    Ringkasan salary dan expense dari histori yang dipakai untuk menyusun plan.
                  </p>
                </div>
                <CupertinoChip tone="neutral">
                  {suggestion.monthlySummaries.length} bulan
                </CupertinoChip>
              </div>
              <CupertinoTable
                columnsClassName="grid-cols-[140px_150px_150px_150px_120px]"
                minWidthClassName="min-w-[760px]"
                headers={[
                  { key: "month", label: "Month" },
                  { key: "salary", label: "Salary" },
                  { key: "expense", label: "Expense" },
                  { key: "net", label: "Net" },
                  { key: "transactions", label: "Transactions" },
                ]}
                hasRows={suggestion.monthlySummaries.length > 0}
                emptyState={
                  <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                    Belum ada histori bulanan untuk ditampilkan.
                  </div>
                }
              >
                {suggestion.monthlySummaries.slice(0, 6).map((row) => (
                  <div
                    key={row.month}
                    className={`grid grid-cols-[140px_150px_150px_150px_120px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
                  >
                    <span className="font-medium text-primary">
                      {formatMonthLabel(row.month)}
                    </span>
                    <span className="text-success tabular-nums">
                      {formatCurrency(row.salaryIncome)}
                    </span>
                    <span className="text-danger tabular-nums">
                      {formatCurrency(row.expense)}
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                      {formatCurrency(row.net)}
                    </span>
                    <span className="font-semibold text-primary">
                      {row.transactionCount}
                    </span>
                  </div>
                ))}
              </CupertinoTable>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
