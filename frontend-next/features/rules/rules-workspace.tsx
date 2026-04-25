"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { Button } from "@/components/ui/button";
import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoConfirmDialog } from "@/components/ui/cupertino-confirm-dialog";
import { CupertinoModal } from "@/components/ui/cupertino-modal";
import { CupertinoTableRowActions } from "@/components/ui/cupertino-table-row-actions";
import { Input } from "@/components/ui/input";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  CATEGORY_COLOR_OPTIONS,
  matchTransactionCategory,
} from "@/lib/categories";
import { CATEGORY_COLOR_HEX } from "@/lib/color-palette";
import { cn } from "@/lib/utils";
import type { CategoryColor, WorkspaceCategory } from "@/types/transaction";

type CategoryFormState = {
  name: string;
  color: CategoryColor;
  keywords: string;
};

const defaultFormState: CategoryFormState = {
  name: "",
  color: "indigo",
  keywords: "",
};

function CategoryChip({
  label,
  color,
}: {
  label: string;
  color: CategoryColor;
}) {
  return <CupertinoChip tone={color}>{label}</CupertinoChip>;
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
  icon: "tag" | "list" | "alert";
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

export function RulesWorkspace() {
  const {
    state,
    isHydrated,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategoryPriority,
  } = useFileWorkspace();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceCategory | null>(
    null,
  );
  const [editingCategory, setEditingCategory] =
    useState<WorkspaceCategory | null>(null);
  const [formState, setFormState] =
    useState<CategoryFormState>(defaultFormState);

  const matchedCounts = useMemo(() => {
    return new Map(
      state.categories.map((category) => {
        const count = state.transactions.filter(
          (transaction) =>
            matchTransactionCategory(
              transaction,
              state.categories,
              state.merchantMappings,
            )?.id === category.id,
        ).length;

        return [category.id, count];
      }),
    );
  }, [state.categories, state.merchantMappings, state.transactions]);

  const summary = useMemo(() => {
    const totalKeywords = state.categories.reduce(
      (count, category) => count + category.keywords.length,
      0,
    );
    const matchedTransactions = state.transactions.filter((transaction) =>
      Boolean(
        matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        ),
      ),
    ).length;

    return {
      totalRules: state.categories.length,
      totalKeywords,
      uncategorizedTransactions: Math.max(
        state.transactions.length - matchedTransactions,
        0,
      ),
    };
  }, [state.categories, state.merchantMappings, state.transactions]);

  function openCreateDialog() {
    setEditingCategory(null);
    setFormState(defaultFormState);
    setDialogOpen(true);
  }

  function openEditDialog(category: WorkspaceCategory) {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      color: category.color,
      keywords: category.keywords.join(", "),
    });
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormState(defaultFormState);
  }

  function handleSubmit() {
    const payload = {
      name: formState.name.trim(),
      color: formState.color,
      keywords: formState.keywords.split(","),
    };

    if (!payload.name) {
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, payload);
    } else {
      addCategory(payload);
    }

    closeDialog();
  }

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <section className="sticky top-[58px] z-10 border-b border-subtle bg-surface md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-primary">
            Rules
          </h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              className="h-9 rounded-[9px] border border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              render={<Link href="/transactions" />}
            >
              Transactions
            </Button>
            <CupertinoActionButton onClick={openCreateDialog}>
              <CupertinoIcon name="plus" className="size-3.5" />
              Add rule
            </CupertinoActionButton>
          </div>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="grid gap-3 md:grid-cols-3">
          <SummaryCard
            title="Total rules"
            value={summary.totalRules}
            description="Jumlah kategori aktif yang memakai keyword matching di workspace."
            icon="tag"
          />
          <SummaryCard
            title="Tracked keywords"
            value={summary.totalKeywords}
            description="Total keyword lintas semua kategori untuk proses klasifikasi otomatis."
            icon="list"
          />
          <SummaryCard
            title="Uncategorized transactions"
            value={summary.uncategorizedTransactions}
            description="Transaksi yang belum masuk kategori dari rules yang aktif saat ini."
            icon="alert"
          />
        </section>

        <section className="rounded-[13px] border-0 bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="flex flex-wrap items-start justify-between gap-3 px-[18px] pt-[18px] pb-3">
            <div className="space-y-1">
              <h2 className="text-[13px] font-semibold text-primary">
                Keyword rules
              </h2>
              <p className="max-w-3xl text-[11px] leading-5 text-tertiary">
                Prioritas rule menentukan kategori mana yang dipilih lebih dulu
                saat satu transaksi cocok ke lebih dari satu keyword.
              </p>
            </div>
            <CupertinoChip tone="neutral">
              {isHydrated ? `${state.categories.length} rules` : "Loading"}
            </CupertinoChip>
          </div>

          <CupertinoTable
            columnsClassName="grid-cols-[minmax(0,1.1fr)_140px_minmax(240px,1.3fr)_100px_96px]"
            minWidthClassName="min-w-[980px]"
            headers={[
              { key: "category", label: "Category" },
              { key: "priority", label: "Priority" },
              { key: "keywords", label: "Keywords" },
              { key: "matched", label: "Matched" },
              { key: "actions", label: "Actions", className: "text-right" },
            ]}
            hasRows={isHydrated && state.categories.length > 0}
            emptyState={
              <div className="px-[18px] py-10 text-center text-sm text-tertiary">
                {!isHydrated
                  ? "Memuat rules workspace..."
                  : "Belum ada rules di workspace."}
              </div>
            }
          >
            {state.categories.map((category) => (
              <div
                key={category.id}
                className={`grid grid-cols-[minmax(0,1.1fr)_140px_minmax(240px,1.3fr)_100px_96px] items-center gap-3 px-[18px] text-[11px] text-secondary ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS}`}
              >
                <div className="min-w-0">
                  <CategoryChip label={category.name} color={category.color} />
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label={`Naikkan prioritas ${category.name}`}
                    onClick={() => moveCategoryPriority(category.id, "up")}
                    className="flex size-8 items-center justify-center rounded-[8px] border border-strong bg-surface text-secondary transition-colors hover:bg-surface-muted"
                  >
                    <CupertinoIcon name="chevronDown" className="size-3.5 rotate-180" />
                  </button>
                  <span className="min-w-7 text-center text-sm font-semibold text-primary">
                    {category.priority}
                  </span>
                  <button
                    type="button"
                    aria-label={`Turunkan prioritas ${category.name}`}
                    onClick={() => moveCategoryPriority(category.id, "down")}
                    className="flex size-8 items-center justify-center rounded-[8px] border border-strong bg-surface text-secondary transition-colors hover:bg-surface-muted"
                  >
                    <CupertinoIcon name="chevronDown" className="size-3.5" />
                  </button>
                </div>

                <div className="flex min-w-0 flex-wrap gap-1.5">
                  {category.keywords.length > 0 ? (
                    category.keywords.map((keyword) => (
                      <CupertinoChip
                        key={`${category.id}-${keyword}`}
                        tone="neutral"
                      >
                        {keyword}
                      </CupertinoChip>
                    ))
                  ) : (
                    <span className="text-xs text-tertiary">No keywords</span>
                  )}
                </div>

                <div>
                  <CupertinoChip tone="neutral">
                    {matchedCounts.get(category.id) ?? 0}
                  </CupertinoChip>
                </div>

                <CupertinoTableRowActions
                  actions={[
                    {
                      label: `Edit ${category.name}`,
                      icon: "settings",
                      onClick: () => openEditDialog(category),
                    },
                    {
                      label: `Delete ${category.name}`,
                      icon: "close",
                      tone: "destructive",
                      onClick: () => setDeleteTarget(category),
                    },
                  ]}
                />
              </div>
            ))}
          </CupertinoTable>
        </section>
      </div>

      <CupertinoModal
        open={dialogOpen}
        onClose={closeDialog}
        title={editingCategory ? "Edit rule" : "Add rule"}
        maxWidthClassName="max-w-[560px]"
      >
        <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary">
                Category name
              </label>
              <Input
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Misalnya: Transport"
                className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary">
                Color
              </label>
              <div className="grid grid-cols-6 gap-2">
                {CATEGORY_COLOR_OPTIONS.map((option) => {
                  const isActive = formState.color === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormState((current) => ({
                          ...current,
                          color: option.value,
                        }))
                      }
                      className={cn(
                        "flex size-8 items-center justify-center rounded-[8px] ring-offset-2 ring-offset-white transition-all",
                        isActive
                          ? "ring-2 ring-[var(--accent)]"
                          : "hover:scale-[1.03]",
                      )}
                      style={{ background: option.color }}
                      aria-label={option.label}
                    >
                      {isActive ? (
                        <span className="size-2 rounded-full bg-surface" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: CATEGORY_COLOR_HEX[formState.color] }}
                />
                <span className="text-[11px] text-tertiary">
                  {
                    CATEGORY_COLOR_OPTIONS.find(
                      (option) => option.value === formState.color,
                    )?.label
                  }
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-tertiary">
                Keywords
              </label>
              <Input
                value={formState.keywords}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    keywords: event.target.value,
                  }))
                }
                placeholder="Pisahkan dengan koma, misalnya: gojek, grab, transport"
                className="h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30"
              />
              <p className="text-[11px] leading-5 text-tertiary">
                Keyword akan dicocokkan ke deskripsi transaksi untuk auto-classification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <CupertinoActionButton tone="white" onClick={closeDialog}>
            Cancel
          </CupertinoActionButton>
          <CupertinoActionButton
            onClick={handleSubmit}
            disabled={!formState.name.trim()}
          >
            Save rule
          </CupertinoActionButton>
        </div>
      </CupertinoModal>

      <CupertinoConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteCategory(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        title="Delete rule?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus dari workspace.`
            : "Rule ini akan dihapus dari workspace."
        }
        confirmLabel="Delete"
        tone="destructive"
      />
    </main>
  );
}
