"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ChevronDown,
  GitBranch,
  Shapes,
  Tags,
  WalletCards,
} from "lucide-react";

import {
  CATEGORY_COLOR_STYLES,
  matchTransactionCategory,
} from "@/lib/categories";
import { matchTransactionMerchantMapping } from "@/lib/merchants";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParsedTransaction, WorkspaceCategory } from "@/types/transaction";

type ClassificationSource = "manual" | "merchant" | "keyword" | "uncategorized";

type ReviewRow = {
  transaction: ParsedTransaction;
  category: WorkspaceCategory | null;
  source: ClassificationSource;
};

function ClassificationSourceBadge({
  source,
}: {
  source: ClassificationSource;
}) {
  if (source === "manual") {
    return (
      <Badge
        variant="outline"
        className="border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/70 dark:bg-indigo-950/40 dark:text-indigo-300"
      >
        Manual
      </Badge>
    );
  }

  if (source === "merchant") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
      >
        Merchant
      </Badge>
    );
  }

  if (source === "keyword") {
    return (
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
      >
        Keyword
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
    >
      Uncategorized
    </Badge>
  );
}

function CategoryPicker({
  category,
  categories,
  onChange,
}: {
  category: WorkspaceCategory | null;
  categories: WorkspaceCategory[];
  onChange: (categoryId: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-muted/60"
          />
        }
      >
        {category ? (
          <Badge
            variant="outline"
            className={CATEGORY_COLOR_STYLES[category.color].badge}
          >
            {category.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">Uncategorized</span>
        )}
        <ChevronDown className="size-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 w-52 overflow-y-auto bg-popover"
      >
        <DropdownMenuItem onClick={() => onChange(null)}>
          Uncategorized
        </DropdownMenuItem>
        {categories.map((item) => (
          <DropdownMenuItem key={item.id} onClick={() => onChange(item.id)}>
            {item.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CategoriesWorkspace() {
  const { state, isHydrated, setTransactionCategory } = useFileWorkspace();

  const processedFiles = useMemo(
    () => state.files.filter((file) => file.status === "processed"),
    [state.files],
  );

  const processedFileNames = useMemo(
    () => new Set(processedFiles.map((file) => file.name)),
    [processedFiles],
  );

  const reviewRows = useMemo<ReviewRow[]>(() => {
    return state.transactions
      .filter((transaction) => processedFileNames.has(transaction.sourceFile))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((transaction) => {
        const category = matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        );

        const source: ClassificationSource = transaction.categoryId
          ? "manual"
          : matchTransactionMerchantMapping(transaction, state.merchantMappings)
            ? "merchant"
            : category
              ? "keyword"
              : "uncategorized";

        return {
          transaction,
          category,
          source,
        };
      });
  }, [
    processedFileNames,
    state.categories,
    state.merchantMappings,
    state.transactions,
  ]);

  const summary = useMemo(() => {
    const categorizedCount = reviewRows.filter((row) => row.category).length;
    const uncategorizedRows = reviewRows.filter((row) => !row.category);
    const needsAttentionRows = reviewRows.filter(
      (row) => row.source === "uncategorized" || row.source === "keyword",
    );
    const manualOverrides = reviewRows.filter(
      (row) => row.source === "manual",
    ).length;
    const uncategorizedAmount = uncategorizedRows.reduce(
      (sum, row) =>
        row.transaction.type === "debit" ? sum + row.transaction.amount : sum,
      0,
    );

    return {
      totalTransactions: reviewRows.length,
      coverage:
        reviewRows.length > 0
          ? Math.round((categorizedCount / reviewRows.length) * 100)
          : 0,
      needsAttention: needsAttentionRows.length,
      manualOverrides,
      uncategorizedAmount,
    };
  }, [reviewRows]);

  const sourceBreakdown = useMemo(
    () => ({
      manual: reviewRows.filter((row) => row.source === "manual").length,
      merchant: reviewRows.filter((row) => row.source === "merchant").length,
      keyword: reviewRows.filter((row) => row.source === "keyword").length,
      uncategorized: reviewRows.filter((row) => row.source === "uncategorized")
        .length,
    }),
    [reviewRows],
  );

  const needsAttentionRows = useMemo(
    () =>
      reviewRows
        .filter(
          (row) => row.source === "uncategorized" || row.source === "keyword",
        )
        .sort((a, b) => {
          if (a.source !== b.source) {
            return a.source === "uncategorized" ? -1 : 1;
          }

          return b.transaction.amount - a.transaction.amount;
        })
        .slice(0, 12),
    [reviewRows],
  );

  const recentReviewRows = useMemo(() => reviewRows.slice(0, 16), [reviewRows]);

  const uncategorizedPreview = useMemo(
    () =>
      reviewRows.filter((row) => row.source === "uncategorized").slice(0, 8),
    [reviewRows],
  );

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
                <BreadcrumbPage>Category Review</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Category Review
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Halaman ini khusus untuk review hasil klasifikasi transaksi
                processed. Bukan tempat mengelola kategori, melainkan tempat
                mengecek hasil auto-classification dan melakukan koreksi cepat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" render={<Link href="/merchants" />}>
                Open merchants
              </Button>
              <Button variant="outline" render={<Link href="/rules" />}>
                Open rules
              </Button>
            </div>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-indigo-200/80 bg-indigo-400/40">
            <CardHeader>
              <CardDescription>Coverage</CardDescription>
              <CardTitle className="text-2xl">{summary.coverage}%</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-200/80 bg-amber-400/40">
            <CardHeader>
              <CardDescription>Needs attention</CardDescription>
              <CardTitle className="text-2xl">
                {summary.needsAttention}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-rose-200/80 bg-rose-400/40">
            <CardHeader>
              <CardDescription>Uncategorized debit</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(summary.uncategorizedAmount)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-emerald-200/80 bg-emerald-400/40">
            <CardHeader>
              <CardDescription>Manual overrides</CardDescription>
              <CardTitle className="text-2xl">
                {summary.manualOverrides}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Needs review first</CardTitle>
                <CardDescription>
                  Prioritaskan transaksi yang masih uncategorized atau baru
                  cocok lewat keyword umum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isHydrated || needsAttentionRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          {!isHydrated
                            ? "Memuat review klasifikasi..."
                            : "Tidak ada transaksi yang perlu diprioritaskan untuk review."}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {needsAttentionRows.map(
                      ({ transaction, category, source }) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell className="max-w-[360px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <ClassificationSourceBadge source={source} />
                          </TableCell>
                          <TableCell>
                            <CategoryPicker
                              category={category}
                              categories={state.categories}
                              onChange={(categoryId) =>
                                setTransactionCategory(
                                  transaction.id,
                                  categoryId,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Recent classification review</CardTitle>
                <CardDescription>
                  Riwayat terbaru hasil klasifikasi, tetap dengan aksi koreksi
                  cepat per transaksi.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Nominal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!isHydrated || recentReviewRows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-muted-foreground"
                        >
                          {!isHydrated
                            ? "Memuat transaksi processed..."
                            : "Belum ada transaksi processed untuk direview."}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {recentReviewRows.map(
                      ({ transaction, category, source }) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell className="max-w-[360px] truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell>
                            <ClassificationSourceBadge source={source} />
                          </TableCell>
                          <TableCell>
                            <CategoryPicker
                              category={category}
                              categories={state.categories}
                              onChange={(categoryId) =>
                                setTransactionCategory(
                                  transaction.id,
                                  categoryId,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {formatCurrency(transaction.amount)}
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GitBranch className="size-4 text-muted-foreground" />
                  <CardTitle>Classification source</CardTitle>
                </div>
                <CardDescription>
                  Halaman ini menjelaskan kategori datang dari mana.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-indigo-200/80 bg-indigo-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Manual
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceBreakdown.manual} transaksi
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ditentukan langsung oleh user dari halaman review ini.
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Merchant mapping
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceBreakdown.merchant} transaksi
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dipetakan dari merchant ke kategori di halaman Merchants.
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Keyword rule
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceBreakdown.keyword} transaksi
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Hasil fallback dari keyword rule kategori.
                  </p>
                </div>
                <div className="rounded-lg border border-rose-200/80 bg-rose-50/60 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      Uncategorized
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {sourceBreakdown.uncategorized} transaksi
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Belum cocok ke merchant mapping maupun keyword rule.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <WalletCards className="size-4 text-muted-foreground" />
                  <CardTitle>Uncategorized preview</CardTitle>
                </div>
                <CardDescription>
                  Potongan transaksi yang masih belum punya kategori.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {uncategorizedPreview.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground">
                    Semua transaksi processed sudah punya kategori.
                  </div>
                ) : (
                  uncategorizedPreview.map(({ transaction }) => (
                    <div
                      key={transaction.id}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-3"
                    >
                      <p className="text-sm font-medium text-foreground">
                        {transaction.description}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-foreground">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shapes className="size-4 text-muted-foreground" />
                  <CardTitle>Workflow</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Gunakan halaman ini untuk{" "}
                  <span className="font-medium text-foreground">review</span>,
                  bukan untuk mendefinisikan kategori baru.
                </p>
                <p>
                  Buka{" "}
                  <span className="font-medium text-foreground">Rules</span>{" "}
                  kalau perlu tambah kategori atau ubah keyword umum.
                </p>
                <p>
                  Buka{" "}
                  <span className="font-medium text-foreground">Merchants</span>{" "}
                  kalau merchant tertentu harus selalu masuk ke kategori yang
                  sama.
                </p>
                <p>
                  Setelah itu, gunakan halaman ini untuk koreksi edge case per
                  transaksi sebelum data dipakai di report.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tags className="size-4 text-muted-foreground" />
                  <CardTitle>Scope</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    Category Review
                  </span>
                  : review hasil klasifikasi dan koreksi cepat.
                </p>
                <p>
                  <span className="font-medium text-foreground">Rules</span>:
                  kelola kategori dan keyword.
                </p>
                <p>
                  <span className="font-medium text-foreground">Merchants</span>
                  : kelola merchant mapping.
                </p>
                <p>
                  <span className="font-medium text-foreground">
                    Category Insights
                  </span>
                  : lihat agregasi dan performa kategori.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
