"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { FilterDropdown } from "@/components/filters/filter-dropdown";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  CATEGORY_COLOR_STYLES,
  sortCategoriesByPriority,
} from "@/lib/categories";
import {
  buildBudgetSuggestion,
  getCurrentMonthValue,
} from "@/lib/budgeting";
import { formatCurrency, formatMonthLabel } from "@/lib/formatters";
import { buildProcessedTransactions } from "@/lib/transaction-review";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>Plan editor</CardTitle>
            <CardDescription>
              Isi dulu pengeluaran wajib, lalu gunakan suggestion untuk membantu membagi sisa target expense ke kategori lain.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {existingPlan ? "Plan tersimpan" : "Belum disimpan"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Salary target
            </label>
            <Input
              inputMode="numeric"
              value={incomeTarget}
              onChange={(event) => setIncomeTarget(event.target.value)}
              className="border-border bg-background"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Expense target
            </label>
            <Input
              inputMode="numeric"
              value={expenseTarget}
              onChange={(event) => setExpenseTarget(event.target.value)}
              className="border-border bg-background"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          `Savings target` diambil dari category `Savings` di tabel allocation,
          bukan dari input terpisah.
        </p>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-emerald-200/80 bg-emerald-400/35">
            <CardHeader>
              <CardDescription>Planned expenses</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(plannedExpenseTotal)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-sky-200/80 bg-sky-400/35">
            <CardHeader>
              <CardDescription>Expense gap</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(expenseGap)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-cyan-200/80 bg-cyan-400/35">
            <CardHeader>
              <CardDescription>Savings from category</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(savingsTargetNumber)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card
            className={
              remainingCashflow >= 0
                ? "border-violet-200/80 bg-violet-400/35"
                : "border-rose-200/80 bg-rose-400/35"
            }
          >
            <CardHeader>
              <CardDescription>Remaining cashflow</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(remainingCashflow)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">
                Required expenses first
              </p>
              <p className="text-xs text-muted-foreground">
                Isi dulu pengeluaran wajib seperti kos, bill, transport rutin, atau cicilan. Setelah itu baru pakai suggestion untuk sisa budget.
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                Add required category
                <Plus className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-popover"
              >
                {availableRows.length === 0 ? (
                  <DropdownMenuItem disabled>
                    Semua kategori sudah dipilih
                  </DropdownMenuItem>
                ) : null}
                {availableRows.map((row) => (
                  <DropdownMenuItem
                    key={row.categoryId}
                    onClick={() => addCategory(row.categoryId)}
                  >
                    {row.categoryName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Suggested</TableHead>
                <TableHead>Last reference month</TableHead>
                <TableHead>Planned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-10 text-center text-muted-foreground"
                  >
                    Belum ada pengeluaran wajib di plan ini. Tambahkan dulu category yang memang harus dibayar tiap bulan.
                  </TableCell>
                </TableRow>
              ) : null}
              {selectedRows.map((row) => (
                <TableRow key={row.categoryId}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={CATEGORY_COLOR_STYLES[row.color].badge}
                      >
                        {row.categoryName}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${row.categoryName}`}
                        onClick={() => removeCategory(row.categoryId)}
                      >
                        <Trash2 className="size-4 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(row.recommendedAmount)}</TableCell>
                  <TableCell>{formatCurrency(row.lastMonthExpense)}</TableCell>
                  <TableCell className="w-[180px]">
                    <Input
                      inputMode="numeric"
                      value={categoryInputs[row.categoryId] ?? "0"}
                      onChange={(event) =>
                        setCategoryInputs((current) => ({
                          ...current,
                          [row.categoryId]: event.target.value,
                        }))
                      }
                      className="border-border bg-background"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/10 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Suggest the rest
              </p>
              <p className="text-xs text-muted-foreground">
                Setelah pengeluaran wajib diisi, MBG bantu menyarankan category lain untuk sisa target expense yang belum teralokasi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                Remaining expense budget {formatCurrency(remainingExpenseBudget)}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={applyRemainingSuggestions}
                disabled={!canSuggestRemaining || remainingSuggestionRows.length === 0}
              >
                Auto-fill remainder
              </Button>
            </div>
          </div>

          {expenseTargetNumber <= 0 ? (
            <p className="text-sm text-muted-foreground">
              Isi `Expense target` dulu supaya MBG tahu sisa budget yang perlu dibantu.
            </p>
          ) : null}
          {expenseTargetNumber > 0 && selectedRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tambahkan minimal satu pengeluaran wajib dulu sebelum melihat suggestion.
            </p>
          ) : null}
          {expenseTargetNumber > 0 && selectedRows.length > 0 && remainingExpenseBudget <= 0 ? (
            <p className="text-sm text-muted-foreground">
              Tidak ada sisa target expense untuk disarankan. Kurangi plan wajib atau naikkan `Expense target`.
            </p>
          ) : null}
          {canSuggestRemaining && remainingSuggestionRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada histori category lain yang cukup untuk dijadikan suggestion.
            </p>
          ) : null}

          {canSuggestRemaining && remainingSuggestionRows.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Historical avg</TableHead>
                  <TableHead>Suggested for remainder</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remainingSuggestionRows.map((row) => (
                  <TableRow key={`${row.categoryId}-suggestion`}>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={CATEGORY_COLOR_STYLES[row.color].badge}
                      >
                        {row.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(row.recommendedAmount)}</TableCell>
                    <TableCell>{formatCurrency(row.suggestedPlanAmount)}</TableCell>
                    <TableCell className="w-[140px]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          addCategory(row.categoryId, row.suggestedPlanAmount)
                        }
                      >
                        Add
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={savePlan}>Save plan</Button>
          {existingPlan ? (
            <Button variant="outline" onClick={() => onDelete(month)}>
              Delete saved plan
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
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
    () =>
      buildProcessedTransactions(
        state.files,
        state.transactions,
        state.categories,
        state.merchantMappings,
      ),
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
      note:
        suggestion.baselineSalary > 0
          ? `Rata-rata kategori Salary dari ${suggestion.historyMonths.length || 0} bulan referensi`
          : "Belum ada histori kategori Salary",
      icon: TrendingUp,
      className: "border-emerald-200/80 bg-emerald-400/35",
      iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
    },
    {
      title: "Average expense",
      value: formatCurrency(suggestion.baselineExpense),
      note: "Rata-rata pengeluaran bulanan",
      icon: TrendingDown,
      className: "border-rose-200/80 bg-rose-400/35",
      iconClassName: "bg-rose-100 text-rose-500 ring-rose-200/80",
    },
    {
      title: "Suggested savings",
      value: formatCurrency(suggestion.baselineSavings),
      note: `${suggestion.savingsRate}% dari salary baseline`,
      icon: PiggyBank,
      className: "border-sky-200/80 bg-sky-400/35",
      iconClassName: "bg-sky-100 text-sky-500 ring-sky-200/80",
    },
    {
      title: "Selected month",
      value: formatMonthLabel(targetMonth),
      note: existingPlan ? "Plan sudah tersimpan" : "Belum ada plan tersimpan",
      icon: Target,
      className: "border-violet-200/80 bg-violet-400/35",
      iconClassName: "bg-violet-100 text-violet-500 ring-violet-200/80",
    },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Budgeting</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Budgeting
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Buat plan bulanan berdasarkan histori pemasukan dan pengeluaran
              processed. Baseline pemasukan diambil dari kategori Salary, lalu
              user bisa sesuaikan target salary, expense, savings, dan alokasi
              per kategori.
            </p>
          </div>
        </section>

        <Separator />

        {!isHydrated || processedTransactions.length === 0 ? (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Belum ada histori untuk budgeting</CardTitle>
              <CardDescription>
                Budgeting baru bisa dibuat setelah ada file berstatus processed.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button variant="outline" render={<Link href="/file" />}>
                Buka File
              </Button>
              <Button variant="outline" render={<Link href="/file/review" />}>
                Buka Review Queue
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((item) => {
                const Icon = item.icon;

                return (
                  <Card key={item.title} className={item.className}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardDescription>{item.title}</CardDescription>
                          <CardTitle className="mt-1 text-2xl">
                            {item.value}
                          </CardTitle>
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

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <CardTitle>Planning setup</CardTitle>
                </div>
                <CardDescription>
                  Pilih bulan target dan jumlah histori yang dipakai sebagai baseline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Target month
                    </label>
                    <Input
                      type="month"
                      value={targetMonth}
                      onChange={(event) =>
                        setTargetMonth(event.target.value || getCurrentMonthValue())
                      }
                      className="border-border bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Baseline window
                    </label>
                    <FilterDropdown
                      value={lookbackMonths}
                      placeholder="3 bulan terakhir"
                      options={LOOKBACK_OPTIONS}
                      onChange={setLookbackMonths}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    Referensi:{" "}
                    {suggestion.historyMonths.length > 0
                      ? suggestion.historyMonths
                          .map((month) => formatMonthLabel(month))
                          .join(", ")
                      : "Belum ada histori referensi"}
                  </Badge>
                  {suggestion.uncategorizedAverageExpense > 0 ? (
                    <Badge variant="outline">
                      Avg uncategorized expense{" "}
                      {formatCurrency(suggestion.uncategorizedAverageExpense)}
                    </Badge>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <BudgetPlanner
              key={`${targetMonth}-${lookbackMonths}-${existingPlan?.updatedAt ?? "new"}`}
              month={targetMonth}
              existingPlan={existingPlan}
              plannerRows={plannerRows}
              onSave={upsertBudgetPlan}
              onDelete={deleteBudgetPlan}
            />

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Monthly baseline history</CardTitle>
                <CardDescription>
                  Ringkasan salary dan expense dari histori yang dipakai untuk menyusun plan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Salary</TableHead>
                      <TableHead>Expense</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestion.monthlySummaries.slice(0, 6).map((row) => (
                      <TableRow key={row.month}>
                        <TableCell>{formatMonthLabel(row.month)}</TableCell>
                        <TableCell>{formatCurrency(row.salaryIncome)}</TableCell>
                        <TableCell>{formatCurrency(row.expense)}</TableCell>
                        <TableCell>{formatCurrency(row.net)}</TableCell>
                        <TableCell>{row.transactionCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
