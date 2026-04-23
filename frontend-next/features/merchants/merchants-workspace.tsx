"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronDown,
  GitMerge,
  Pencil,
  Search,
  Store,
} from "lucide-react";

import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { CATEGORY_COLOR_STYLES, matchTransactionCategory } from "@/lib/categories";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { resolveTransactionMerchant } from "@/lib/merchants";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MerchantRow = {
  merchantKey: string;
  merchantName: string;
  extractedKeys: string[];
  count: number;
  incomeTotal: number;
  expenseTotal: number;
  lastDate: string;
  mappingCategoryId: string | null;
};

export function MerchantsWorkspace() {
  const {
    state,
    isHydrated,
    setMerchantCategory,
    updateMerchantName,
    mergeMerchantMapping,
  } = useFileWorkspace();
  const [selectedMerchantKey, setSelectedMerchantKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mapped" | "unmapped">(
    "all",
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingMerchant, setEditingMerchant] = useState<MerchantRow | null>(null);
  const [editingName, setEditingName] = useState("");
  const [mergeSource, setMergeSource] = useState<MerchantRow | null>(null);
  const [mergeSearchQuery, setMergeSearchQuery] = useState("");
  const [mergeTargetKey, setMergeTargetKey] = useState<string | null>(null);

  const processedFileNames = useMemo(
    () =>
      new Set(
        state.files
          .filter((file) => file.status === "processed")
          .map((file) => file.name),
      ),
    [state.files],
  );

  const processedTransactions = useMemo(
    () =>
      state.transactions
        .filter((transaction) => processedFileNames.has(transaction.sourceFile))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [processedFileNames, state.transactions],
  );

  const merchantRows = useMemo<MerchantRow[]>(() => {
    const map = new Map<string, MerchantRow>();

    for (const transaction of processedTransactions) {
      const resolved = resolveTransactionMerchant(
        transaction,
        state.merchantMappings,
      );
      const merchantKey = resolved.merchantKey;
      const merchantName = resolved.merchantName;

      const current = map.get(merchantKey) ?? {
        merchantKey,
        merchantName,
        extractedKeys: [],
        count: 0,
        incomeTotal: 0,
        expenseTotal: 0,
        lastDate: transaction.date,
        mappingCategoryId: resolved.mapping?.categoryId ?? null,
      };

      current.extractedKeys = [...new Set([...current.extractedKeys, resolved.extractedKey])];
      current.count += 1;
      if (transaction.type === "credit") {
        current.incomeTotal += transaction.amount;
      } else {
        current.expenseTotal += transaction.amount;
      }

      if (transaction.date > current.lastDate) {
        current.lastDate = transaction.date;
      }

      map.set(merchantKey, current);
    }

    return [...map.values()].sort(
      (a, b) =>
        b.count - a.count ||
        b.expenseTotal + b.incomeTotal - (a.expenseTotal + a.incomeTotal),
    );
  }, [processedTransactions, state.merchantMappings]);

  const activeMerchantKey = useMemo(() => {
    if (merchantRows.length === 0) {
      return null;
    }

    if (
      selectedMerchantKey &&
      merchantRows.some((row) => row.merchantKey === selectedMerchantKey)
    ) {
      return selectedMerchantKey;
    }

    return merchantRows[0].merchantKey;
  }, [merchantRows, selectedMerchantKey]);

  const selectedMerchant = useMemo(
    () => merchantRows.find((row) => row.merchantKey === activeMerchantKey) ?? null,
    [activeMerchantKey, merchantRows],
  );

  const selectedMerchantTransactions = useMemo(
    () =>
      selectedMerchant
        ? processedTransactions
            .filter(
              (transaction) => {
                const resolved = resolveTransactionMerchant(
                  transaction,
                  state.merchantMappings,
                );
                return resolved.merchantKey === selectedMerchant.merchantKey;
              },
            )
            .map((transaction) => ({
              ...transaction,
              resolvedCategory: matchTransactionCategory(
                transaction,
                state.categories,
                state.merchantMappings,
              ),
            }))
        : [],
    [processedTransactions, selectedMerchant, state.categories, state.merchantMappings],
  );

  const summary = useMemo(() => {
    const mapped = merchantRows.filter((row) => row.mappingCategoryId).length;
    const coverage = processedTransactions.filter(
      (transaction) =>
        resolveTransactionMerchant(transaction, state.merchantMappings).mapping,
    ).length;

    return {
      totalMerchants: merchantRows.length,
      mapped,
      unmapped: merchantRows.length - mapped,
      coverage,
    };
  }, [merchantRows, processedTransactions, state.merchantMappings]);

  const filteredMerchantRows = useMemo(() => {
    return merchantRows.filter((row) => {
      const matchesSearch =
        row.merchantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.merchantKey.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "mapped" && Boolean(row.mappingCategoryId)) ||
        (statusFilter === "unmapped" && !row.mappingCategoryId);

      const matchesCategory =
        categoryFilter === "all" || row.mappingCategoryId === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, merchantRows, searchQuery, statusFilter]);

  const mergeTargets = useMemo(() => {
    if (!mergeSource) {
      return [];
    }

    return merchantRows.filter((row) => {
      if (row.merchantKey === mergeSource.merchantKey) {
        return false;
      }

      const query = mergeSearchQuery.toLowerCase().trim();

      if (!query) {
        return true;
      }

      return (
        row.merchantName.toLowerCase().includes(query) ||
        row.merchantKey.toLowerCase().includes(query)
      );
    });
  }, [mergeSearchQuery, mergeSource, merchantRows]);

  function openEditDialog(row: MerchantRow) {
    setEditingMerchant(row);
    setEditingName(row.merchantName);
  }

  function openMergeDialog(row: MerchantRow) {
    setMergeSource(row);
    setMergeSearchQuery("");
    setMergeTargetKey(null);
  }

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
                <BreadcrumbPage>Merchants</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Merchants
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Kelompokkan nama merchant atau payee dari transaksi processed,
                lalu petakan merchant tersebut ke kategori yang paling sesuai.
                Mapping merchant akan dipakai sebelum keyword rules.
              </p>
            </div>
            <Button variant="outline" render={<Link href="/categories" />}>
              Open category review
            </Button>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-indigo-200/80 bg-indigo-400/40">
            <CardHeader>
              <CardDescription>Total merchants</CardDescription>
              <CardTitle className="text-2xl">{summary.totalMerchants}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-emerald-200/80 bg-emerald-400/40">
            <CardHeader>
              <CardDescription>Mapped merchants</CardDescription>
              <CardTitle className="text-2xl">{summary.mapped}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-amber-200/80 bg-amber-400/40">
            <CardHeader>
              <CardDescription>Unmapped merchants</CardDescription>
              <CardTitle className="text-2xl">{summary.unmapped}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-violet-200/80 bg-violet-400/40">
            <CardHeader>
              <CardDescription>Covered transactions</CardDescription>
              <CardTitle className="text-2xl">{summary.coverage}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="size-4 text-muted-foreground" />
                  <CardTitle>Merchant directory</CardTitle>
                </div>
                <CardDescription>
                  Pilih kategori per merchant untuk meningkatkan akurasi klasifikasi
                  transaksi di seluruh workspace.
                </CardDescription>
              </div>
              <div className="grid w-full gap-3 md:grid-cols-3 xl:max-w-4xl">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Search
                  </span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Cari merchant atau key"
                      className="h-10 bg-background pl-9 text-sm"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Status
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors hover:bg-muted/60"
                        />
                      }
                    >
                      <span className="truncate capitalize">{statusFilter}</span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-popover">
                      {["all", "mapped", "unmapped"].map((option) => (
                        <DropdownMenuItem
                          key={option}
                          onClick={() =>
                            setStatusFilter(option as "all" | "mapped" | "unmapped")
                          }
                        >
                          {option === "all"
                            ? "All statuses"
                            : option === "mapped"
                              ? "Mapped only"
                              : "Unmapped only"}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Category
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="inline-flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors hover:bg-muted/60"
                        />
                      }
                    >
                      <span className="truncate">
                        {categoryFilter === "all"
                          ? "All categories"
                          : state.categories.find((category) => category.id === categoryFilter)
                              ?.name ?? "Unknown"}
                      </span>
                      <ChevronDown className="size-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-popover">
                      <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                        All categories
                      </DropdownMenuItem>
                      {state.categories.map((category) => (
                        <DropdownMenuItem
                          key={category.id}
                          onClick={() => setCategoryFilter(category.id)}
                        >
                          {category.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>In / Out</TableHead>
                  <TableHead>Last seen</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!isHydrated || filteredMerchantRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {!isHydrated
                        ? "Memuat merchant workspace..."
                        : "Belum ada merchant yang cocok dengan filter saat ini."}
                    </TableCell>
                  </TableRow>
                ) : null}
                {filteredMerchantRows.map((row) => {
                  const mappedCategory = row.mappingCategoryId
                    ? state.categories.find(
                        (category) => category.id === row.mappingCategoryId,
                      ) ?? null
                    : null;

                  return (
                    <TableRow
                      key={row.merchantKey}
                      className="cursor-pointer"
                      onClick={() => setSelectedMerchantKey(row.merchantKey)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {row.merchantName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.extractedKeys.join(" • ")}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{row.count}</TableCell>
                      <TableCell className="space-y-1">
                        {row.incomeTotal > 0 ? (
                          <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            + {formatCurrency(row.incomeTotal)}
                          </p>
                        ) : null}
                        {row.expenseTotal > 0 ? (
                          <p className="text-sm text-rose-700 dark:text-rose-300">
                            - {formatCurrency(row.expenseTotal)}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatDate(row.lastDate)}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <DropdownMenu>
                              <TooltipTrigger>
                                <DropdownMenuTrigger
                                  render={
                                    <button
                                      type="button"
                                      onClick={(event) => event.stopPropagation()}
                                      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-muted/60"
                                    />
                                  }
                                >
                                  {mappedCategory ? (
                                    <Badge
                                      variant="outline"
                                      className={
                                        CATEGORY_COLOR_STYLES[mappedCategory.color].badge
                                      }
                                    >
                                      {mappedCategory.name}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      Unmapped
                                    </span>
                                  )}
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                </DropdownMenuTrigger>
                              </TooltipTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="max-h-80 w-52 overflow-y-auto bg-popover"
                              >
                                <DropdownMenuItem
                                  onClick={() =>
                                    setMerchantCategory(
                                      row.merchantKey,
                                      row.merchantName,
                                      null,
                                    )
                                  }
                                >
                                  Unmapped
                                </DropdownMenuItem>
                                {state.categories.map((category) => (
                                  <DropdownMenuItem
                                    key={category.id}
                                    onClick={() =>
                                      setMerchantCategory(
                                        row.merchantKey,
                                        row.merchantName,
                                        category.id,
                                      )
                                    }
                                  >
                                    {category.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <TooltipContent>Set category</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Edit ${row.merchantName}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEditDialog(row);
                                    }}
                                  />
                                }
                              >
                                <Pencil className="size-4 text-slate-600" />
                              </TooltipTrigger>
                              <TooltipContent>Edit merchant name</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Merge ${row.merchantName}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openMergeDialog(row);
                                    }}
                                  />
                                }
                              >
                                <GitMerge className="size-4 text-slate-600" />
                              </TooltipTrigger>
                              <TooltipContent>Merge merchant</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Merchant preview</CardTitle>
            <CardDescription>
              Preview transaksi dari merchant yang dipilih untuk memastikan
              mapping kategori sudah sesuai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedMerchant || selectedMerchantTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Pilih merchant dari tabel di atas untuk melihat preview.
                    </TableCell>
                  </TableRow>
                ) : null}
                {selectedMerchantTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="max-w-[420px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell>
                      {transaction.resolvedCategory ? (
                        <Badge
                          variant="outline"
                          className={
                            CATEGORY_COLOR_STYLES[
                              transaction.resolvedCategory.color
                            ].badge
                          }
                        >
                          {transaction.resolvedCategory.name}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Uncategorized
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{transaction.sourceFile}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(editingMerchant)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingMerchant(null);
              setEditingName("");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit merchant name</DialogTitle>
              <DialogDescription>
                Ubah nama merchant hasil ekstraksi agar lebih rapi dan konsisten
                di seluruh workspace.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Merchant name
                </p>
                <Input
                  value={editingName}
                  onChange={(event) => setEditingName(event.target.value)}
                  className="h-10 bg-background text-sm"
                />
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                Key asal: {editingMerchant?.merchantKey ?? "-"}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingMerchant(null);
                  setEditingName("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!editingMerchant) {
                    return;
                  }

                  updateMerchantName(editingMerchant.merchantKey, editingName);
                  setEditingMerchant(null);
                  setEditingName("");
                }}
              >
                Save name
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(mergeSource)}
          onOpenChange={(open) => {
            if (!open) {
              setMergeSource(null);
              setMergeSearchQuery("");
              setMergeTargetKey(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Merge merchants</DialogTitle>
              <DialogDescription>
                Gabungkan merchant yang sebenarnya sama ke satu mapping agar
                kategori dan analitiknya konsisten.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                Source:{" "}
                <span className="font-medium text-foreground">
                  {mergeSource?.merchantName ?? "-"}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Find target merchant
                </p>
                <Input
                  value={mergeSearchQuery}
                  onChange={(event) => setMergeSearchQuery(event.target.value)}
                  placeholder="Cari merchant tujuan merge"
                  className="h-10 bg-background text-sm"
                />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/10 p-2">
                {mergeTargets.map((row) => (
                  <button
                    key={row.merchantKey}
                    type="button"
                    onClick={() => setMergeTargetKey(row.merchantKey)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors ${
                      mergeTargetKey === row.merchantKey
                        ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-900/70 dark:bg-indigo-950/40"
                        : "border-transparent bg-background hover:bg-muted/40"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {row.merchantName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.count} transaksi
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {row.mappingCategoryId
                        ? state.categories.find(
                            (category) => category.id === row.mappingCategoryId,
                          )?.name ?? "-"
                        : "Unmapped"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setMergeSource(null);
                  setMergeSearchQuery("");
                  setMergeTargetKey(null);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={!mergeSource || !mergeTargetKey}
                onClick={() => {
                  if (!mergeSource || !mergeTargetKey) {
                    return;
                  }

                  mergeMerchantMapping(mergeSource.merchantKey, mergeTargetKey);
                  setMergeSource(null);
                  setMergeSearchQuery("");
                  setMergeTargetKey(null);
                }}
              >
                Merge merchant
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
