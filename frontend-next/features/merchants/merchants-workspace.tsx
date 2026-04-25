"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GitMerge, Pencil, Search } from "lucide-react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoModal } from "@/components/ui/cupertino-modal";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { CupertinoTableRowActions } from "@/components/ui/cupertino-table-row-actions";
import { Input } from "@/components/ui/input";
import { SummaryCard } from "@/components/ui/summary-card";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { matchTransactionCategory } from "@/lib/categories";
import { resolveTransactionMerchant } from "@/lib/merchants";
import { cn } from "@/lib/utils";

type MerchantRow = {
  merchantKey: string;
  merchantName: string;
  extractedKeys: string[];
  count: number;
  incomeTotal: number;
  expenseTotal: number;
  lastDate: string;
  hasMapping: boolean;
};

function CategoryChip({
  label,
  color,
}: {
  label: string;
  color:
    | "indigo"
    | "sky"
    | "emerald"
    | "amber"
    | "rose"
    | "violet";
}) {
  return <CupertinoChip tone={color}>{label}</CupertinoChip>;
}

export function MerchantsWorkspace() {
  const {
    state,
    isHydrated,
    updateMerchantName,
    mergeMerchantMapping,
  } = useFileWorkspace();
  const [selectedMerchantKey, setSelectedMerchantKey] = useState<string | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "saved" | "raw">(
    "all",
  );
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
        hasMapping: Boolean(resolved.mapping),
      };

      current.extractedKeys = [
        ...new Set([...current.extractedKeys, resolved.extractedKey]),
      ];
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
            .filter((transaction) => {
              const resolved = resolveTransactionMerchant(
                transaction,
                state.merchantMappings,
              );
              return resolved.merchantKey === selectedMerchant.merchantKey;
            })
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
    const mapped = merchantRows.filter((row) => row.hasMapping).length;
    const coverage = processedTransactions.filter((transaction) =>
      Boolean(resolveTransactionMerchant(transaction, state.merchantMappings).mapping),
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
        (statusFilter === "saved" && row.hasMapping) ||
        (statusFilter === "raw" && !row.hasMapping);

      return matchesSearch && matchesStatus;
    });
  }, [merchantRows, searchQuery, statusFilter]);

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

  const statusOptions = [
    { value: "all", label: "All statuses" },
    { value: "saved", label: "Saved only" },
    { value: "raw", label: "Raw only" },
  ];

  function openEditDialog(row: MerchantRow) {
    setEditingMerchant(row);
    setEditingName(row.merchantName);
  }

  function closeEditDialog() {
    setEditingMerchant(null);
    setEditingName("");
  }

  function openMergeDialog(row: MerchantRow) {
    setMergeSource(row);
    setMergeSearchQuery("");
    setMergeTargetKey(null);
  }

  function closeMergeDialog() {
    setMergeSource(null);
    setMergeSearchQuery("");
    setMergeTargetKey(null);
  }

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <section className="sticky top-[58px] z-10 border-b border-subtle bg-surface md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-primary">
            Advanced Tools
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              className="h-9 rounded-[9px] border border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              render={<Link href="/categories" />}
            >
              Categories
            </Button>
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Total merchants"
            value={summary.totalMerchants}
            description="Jumlah merchant unik dari seluruh transaksi workspace yang sudah dikenali sistem."
            icon="store"
          />
          <SummaryCard
            title="Saved merchants"
            value={summary.mapped}
            description="Merchant yang sudah disimpan sebagai nama canonical atau hasil merge alias di workspace."
            icon="check"
          />
          <SummaryCard
            title="Raw merchants"
            value={summary.unmapped}
            description="Merchant yang masih tampil dari hasil ekstraksi mentah tanpa normalisasi nama khusus."
            icon="alert"
          />
          <SummaryCard
            title="Normalized transactions"
            value={summary.coverage}
            description="Jumlah transaksi workspace yang memakai nama merchant tersimpan atau hasil merge alias."
            icon="list"
          />
        </section>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Merchant normalization
              </h2>
              <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                Halaman ini dipakai untuk merapikan nama merchant dan
                menggabungkan alias payee yang sebenarnya sama, tanpa mengubah kategori.
              </p>
            </div>
            <CupertinoChip tone="neutral">
              {isHydrated ? `${filteredMerchantRows.length} merchants` : "Loading"}
            </CupertinoChip>
          </div>

          <div className="grid gap-3 px-[18px] pb-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-medium text-tertiary">
                Search
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari merchant atau key"
                  className="h-10 rounded-[10px] border-subtle bg-surface-muted pl-9 shadow-none focus-visible:ring-[var(--accent)]/30"
                />
              </div>
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-medium text-tertiary">
                Status
              </span>
              <CupertinoSelect
                icon="list"
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(value as "all" | "saved" | "raw")
                }
                options={statusOptions}
                minWidthClassName="w-full"
                ariaLabel="Filter merchant status"
              />
            </label>
          </div>

          <CupertinoTable
            columnsClassName="grid-cols-[minmax(0,1.3fr)_90px_160px_110px_120px_96px]"
            minWidthClassName="min-w-[980px]"
            headers={[
              { key: "merchant", label: "Merchant" },
              { key: "transactions", label: "Transactions" },
              { key: "flow", label: "In / Out" },
              { key: "last", label: "Last seen" },
              { key: "status", label: "Status" },
              { key: "actions", label: "Actions", className: "text-right" },
            ]}
            hasRows={isHydrated && filteredMerchantRows.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat merchant workspace..."
                  : "Belum ada merchant yang cocok dengan filter saat ini."}
              </div>
            }
          >
            {filteredMerchantRows.map((row) => {
              return (
                <div
                  key={row.merchantKey}
                  className={cn(
                    `grid cursor-pointer grid-cols-[minmax(0,1.3fr)_90px_160px_110px_120px_96px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS} transition`,
                    activeMerchantKey === row.merchantKey
                      ? "bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]"
                      : "hover:bg-surface-muted",
                  )}
                  onClick={() => setSelectedMerchantKey(row.merchantKey)}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-[11px] font-medium text-primary">
                      {row.merchantName}
                    </p>
                    <p className="truncate text-[11px] text-tertiary">
                      {row.extractedKeys.join(" • ")}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-primary">
                    {row.count}
                  </span>
                  <div className="space-y-1 text-[11px]">
                    {row.incomeTotal > 0 ? (
                      <p className="font-medium text-success">
                        + {formatCurrency(row.incomeTotal)}
                      </p>
                    ) : null}
                    {row.expenseTotal > 0 ? (
                      <p className="font-medium text-danger">
                        - {formatCurrency(row.expenseTotal)}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-[11px] text-secondary">
                    {formatDate(row.lastDate)}
                  </span>
                  <div>
                    <CupertinoChip tone={row.hasMapping ? "status-success" : "neutral"}>
                      {row.hasMapping ? "Saved" : "Raw"}
                    </CupertinoChip>
                  </div>
                  <CupertinoTableRowActions
                    actions={[
                      {
                        label: `Edit ${row.merchantName}`,
                        icon: "settings",
                        onClick: () => openEditDialog(row),
                        children: <Pencil className="size-4 text-current" />,
                      },
                      {
                        label: `Merge ${row.merchantName}`,
                        icon: "repeat",
                        onClick: () => openMergeDialog(row),
                        children: <GitMerge className="size-4 text-current" />,
                      },
                    ]}
                  />
                </div>
              );
            })}
          </CupertinoTable>
        </section>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Merchant preview
              </h2>
              <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                Preview transaksi dari merchant terpilih untuk memastikan nama
                merchant dan alias yang digabung sudah konsisten.
              </p>
            </div>
            {selectedMerchant ? (
              <CupertinoChip tone="neutral">
                {selectedMerchant.merchantName}
              </CupertinoChip>
            ) : null}
          </div>

          <CupertinoTable
            columnsClassName="grid-cols-[110px_minmax(0,1.5fr)_150px_120px_180px]"
            minWidthClassName="min-w-[900px]"
            headers={[
              { key: "date", label: "Tanggal" },
              { key: "description", label: "Deskripsi" },
              { key: "category", label: "Category" },
              { key: "amount", label: "Nominal" },
              { key: "file", label: "File" },
            ]}
            hasRows={Boolean(selectedMerchant) && selectedMerchantTransactions.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                Pilih merchant dari tabel di atas untuk melihat preview.
              </div>
            }
          >
            {selectedMerchantTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                className={`grid grid-cols-[110px_minmax(0,1.5fr)_150px_120px_180px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
              >
                <span className="text-[11px] text-secondary">
                  {formatDate(transaction.date)}
                </span>
                <span className="truncate text-[11px] text-primary">
                  {transaction.description}
                </span>
                <span>
                  {transaction.resolvedCategory ? (
                    <CategoryChip
                      label={transaction.resolvedCategory.name}
                      color={transaction.resolvedCategory.color}
                    />
                  ) : (
                    <span className="text-[11px] text-tertiary">
                      Uncategorized
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  {formatCurrency(transaction.amount)}
                </span>
                <span className="truncate text-[11px] text-secondary">
                  {transaction.sourceFile}
                </span>
              </div>
            ))}
          </CupertinoTable>
        </section>
      </div>

      <CupertinoModal
        open={Boolean(editingMerchant)}
        onClose={closeEditDialog}
        title="Edit merchant name"
      >
        <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary">
                Merchant name
              </label>
              <Input
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
              />
            </div>
            <div className="rounded-[10px] bg-surface-muted px-3 py-2 text-[11px] text-tertiary">
              Key asal: {editingMerchant?.merchantKey ?? "-"}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <CupertinoActionButton tone="white" onClick={closeEditDialog}>
            Cancel
          </CupertinoActionButton>
          <CupertinoActionButton
            onClick={() => {
              if (!editingMerchant) {
                return;
              }

              updateMerchantName(editingMerchant.merchantKey, editingName);
              closeEditDialog();
            }}
          >
            Save name
          </CupertinoActionButton>
        </div>
      </CupertinoModal>

      <CupertinoModal
        open={Boolean(mergeSource)}
        onClose={closeMergeDialog}
        title="Merge merchants"
        maxWidthClassName="max-w-[560px]"
      >
        <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-4">
          <div className="space-y-4">
            <div className="rounded-[10px] bg-surface-muted px-3 py-2 text-[11px] text-tertiary">
              Source:{" "}
              <span className="font-medium text-primary">
                {mergeSource?.merchantName ?? "-"}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary">
                Find target merchant
              </label>
              <Input
                value={mergeSearchQuery}
                onChange={(event) => setMergeSearchQuery(event.target.value)}
                placeholder="Cari merchant tujuan merge"
                className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
              />
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto rounded-[10px] bg-surface-muted p-2">
              {mergeTargets.map((row) => (
                <button
                  key={row.merchantKey}
                  type="button"
                  onClick={() => setMergeTargetKey(row.merchantKey)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left transition-colors",
                    mergeTargetKey === row.merchantKey
                      ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                      : "bg-surface dark:bg-surface-raised hover:bg-surface-muted",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-primary">
                      {row.merchantName}
                    </p>
                    <p className="truncate text-[11px] text-tertiary">
                      {row.extractedKeys.join(" • ")}
                    </p>
                  </div>
                  {mergeTargetKey === row.merchantKey ? (
                    <CupertinoIcon
                      name="check"
                      className="size-4 text-accent"
                    />
                  ) : null}
                </button>
              ))}

              {mergeTargets.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-tertiary">
                  Tidak ada merchant lain yang cocok untuk merge.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <CupertinoActionButton tone="white" onClick={closeMergeDialog}>
            Cancel
          </CupertinoActionButton>
          <CupertinoActionButton
            disabled={!mergeSource || !mergeTargetKey}
            onClick={() => {
              if (!mergeSource || !mergeTargetKey) {
                return;
              }

              mergeMerchantMapping(mergeSource.merchantKey, mergeTargetKey);
              closeMergeDialog();
            }}
          >
            Merge merchant
          </CupertinoActionButton>
        </div>
      </CupertinoModal>
    </main>
  );
}
