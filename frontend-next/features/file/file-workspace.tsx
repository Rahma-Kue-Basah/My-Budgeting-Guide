"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  CupertinoTable,
  CUPERTINO_TABLE_ROW_HEIGHT_CLASS,
} from "@/components/tables/cupertino-table";
import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { CupertinoConfirmDialog } from "@/components/ui/cupertino-confirm-dialog";
import { CupertinoModal } from "@/components/ui/cupertino-modal";
import { WorkspacePrimaryButton } from "@/components/ui/workspace-primary-button";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { CupertinoTableRowActions } from "@/components/ui/cupertino-table-row-actions";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import { WorkspaceTopBarActionButton } from "@/components/ui/workspace-top-bar-action-button";
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatRelativeTime,
  formatShortDateTime,
  formatStatementPeriod,
} from "@/lib/formatters";
import {
  matchTransactionCategory,
} from "@/lib/categories";
import {
  resolveTransactionMerchant,
} from "@/lib/merchants";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  CategoryColor,
  ParsedTransaction,
  TransactionType,
  UploadedPdfFile,
} from "@/types/transaction";

type ClassificationSource = "manual" | "keyword" | "uncategorized";

type ReviewClassificationRow = ParsedTransaction & {
  merchantName: string;
  categoryName: string | null;
  categoryColor: CategoryColor | null;
  source: ClassificationSource;
};

const supportedBanks = [
  { value: "bca", label: "BCA" },
  // { value: "mandiri", label: "Mandiri" },
  // { value: "bni", label: "BNI" },
  // { value: "bri", label: "BRI" },
  // { value: "cimb", label: "CIMB Niaga" },
];

function StatusBadge({ status }: { status: UploadedPdfFile["status"] }) {
  if (status === "processed") {
    return (
      <CupertinoChip tone="status-success">
        Processed
      </CupertinoChip>
    );
  }

  return (
    <Link href="/file" aria-label="Open import review">
      <CupertinoChip
        tone="status-warning"
        className="transition-colors hover:border-amber-300 hover:bg-amber-100"
      >
        Review needed
      </CupertinoChip>
    </Link>
  );
}

function BankChip({ label }: { label: string }) {
  return <CupertinoChip tone="bank">{label}</CupertinoChip>;
}

function CategoryChip({
  label,
  color,
}: {
  label: string;
  color: CategoryColor;
}) {
  return <CupertinoChip tone={color}>{label}</CupertinoChip>;
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

type ConfirmActionState =
  | {
      kind: "process-file";
      id: string;
      label: string;
    }
  | {
      kind: "delete-file";
      id: string;
      label: string;
    }
  | {
      kind: "delete-transaction";
      id: string;
      label: string;
    }
  | null;

function UploadPanel({
  onUpload,
  isUploading,
  error,
  selectedBank,
  onBankChange,
}: {
  onUpload: (files: FileList | File[], selectedBank: string) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  selectedBank: string;
  onBankChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isExampleOpen, setIsExampleOpen] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    void onUpload(files, selectedBank);
  }

  return (
    <div className="rounded-[13px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="px-[18px] pt-[18px] pb-3">
        <div className="space-y-1">
          <p className="text-[13px] font-semibold text-primary">
            Import statement PDFs
          </p>
          <p className="text-[11px] leading-5 text-tertiary">
            Pilih bank terlebih dulu, lalu tambahkan file PDF mutasi rekening
            untuk diparse, dikategorikan otomatis lewat rules, lalu masuk ke workspace Nidhi.id.
          </p>
        </div>
      </div>
      <div className="space-y-5 px-[18px] pb-[18px]">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <div
          className="rounded-[16px] border border-subtle bg-surface p-3 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors data-[dragging=true]:border-accent/20 data-[dragging=true]:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_0_0_3px_rgba(0,122,255,0.08)]"
          data-dragging={isDragging}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleFiles(event.dataTransfer.files);
          }}
        >
          <div className="rounded-[13px] border border-dashed border-strong bg-surface-muted px-5 py-7 data-[dragging=true]:border-accent/35 data-[dragging=true]:bg-[color-mix(in_srgb,var(--accent)_5%,transparent)]">
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
              <div className="flex size-12 items-center justify-center rounded-[12px] bg-surface dark:bg-surface-muted shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none">
                <CupertinoIcon name="upload" className="size-5 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">
                  Drag and drop file PDF mutasi rekening
                </p>
                <p className="text-[11px] leading-5 text-tertiary">
                  Parser membaca text layer PDF, membuat draft transaksi, lalu mencoba assign category sejak awal sebelum file dipindahkan ke Transactions.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <CupertinoActionButton
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  <CupertinoIcon name="upload" className="size-3.5" />
                  {isUploading ? "Memproses PDF..." : "Pilih file PDF"}
                </CupertinoActionButton>
                <CupertinoSelect
                  icon="wallet"
                  value={selectedBank}
                  onChange={onBankChange}
                  ariaLabel="Select bank"
                  minWidthClassName="min-w-[188px]"
                  options={supportedBanks.map((bank) => ({
                    value: bank.value,
                    label: bank.label,
                    leadingLabel: bank.label.slice(0, 2).toUpperCase(),
                    leadingColor:
                      bank.value === "bca"
                        ? "var(--accent)"
                        : bank.value === "mandiri"
                          ? "var(--warning)"
                          : bank.value === "bni"
                          ? "var(--warning)"
                          : bank.value === "bri"
                            ? "var(--accent)"
                            : "var(--text-secondary)",
                  }))}
                />
                <CupertinoActionButton
                  tone="white"
                  onClick={() => setIsExampleOpen(true)}
                >
                  <CupertinoIcon name="paperclip" className="size-3.5" />
                  Lihat contoh format
                </CupertinoActionButton>
              </div>
              {error ? (
                <p className="text-xs text-danger">{error}</p>
              ) : (
                <p className="text-[11px] text-tertiary">
                  PDF diparse langsung di browser dan disimpan ke local storage.
                </p>
              )}
            </div>
          </div>
        </div>

        <CupertinoModal
          open={isExampleOpen}
          onClose={() => setIsExampleOpen(false)}
          title="Contoh format mutasi rekening"
          maxWidthClassName="max-w-[860px]"
        >
          <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-4">
            <Image
              src="/images/example-mutation.png"
              alt="Contoh format file mutasi rekening"
              width={794}
              height={1123}
              className="h-auto w-full rounded-[12px] border border-strong bg-surface"
            />
          </div>
        </CupertinoModal>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[12px] border border-subtle bg-surface-muted px-4 py-3">
            <p className="text-[12px] font-semibold text-primary">Format</p>
            <p className="text-[11px] text-tertiary">PDF mutasi rekening bank</p>
          </div>
          <div className="rounded-[12px] border border-subtle bg-surface-muted px-4 py-3">
            <p className="text-[12px] font-semibold text-primary">Merge</p>
            <p className="text-[11px] text-tertiary">Gabung file baru ke data yang ada</p>
          </div>
          <div className="rounded-[12px] border border-subtle bg-surface-muted px-4 py-3">
            <p className="text-[12px] font-semibold text-primary">Storage</p>
            <p className="text-[11px] text-tertiary">Simpan state lokal di browser</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: "folder" | "check" | "search" | "calendar";
  href?: string;
}) {
  const content = (
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
          <CupertinoIcon
            name={icon}
            className="size-4 text-secondary"
          />
        </span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-tertiary">
        {description}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

function SummaryGrid({
  totalFiles,
  processed,
  review,
  recent,
}: {
  totalFiles: number;
  processed: number;
  review: number;
  recent: number;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Total files"
        value={totalFiles}
        description="PDF mutasi tersimpan di workspace lokal."
        icon="folder"
      />
      <SummaryCard
        title="Processed"
        value={processed}
        description="File yang sudah siap dipakai sebagai transaksi."
        icon="check"
      />
      <SummaryCard
        title="Pending review"
        value={review}
        description="File yang masih perlu dicek hasil parsing-nya."
        icon="search"
        href="/file"
      />
      <SummaryCard
        title="Recent imports"
        value={recent}
        description="Upload file dalam 7 hari terakhir."
        icon="calendar"
      />
    </section>
  );
}

function FileTable({
  files,
  search,
  onSearchChange,
  onReset,
}: {
  files: UploadedPdfFile[];
  search: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-[13px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="px-[18px] py-3.5">
        <p className="text-[13px] font-semibold text-primary">Daftar file PDF</p>
        <p className="text-[11px] text-tertiary">
          Semua file mutasi yang sudah diupload ke workspace Nidhi.id.
        </p>
      </div>
      <div className="space-y-4 px-[18px] pb-[18px]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-2xl">
            <CupertinoIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-tertiary" name="search" />
            <Input
              placeholder="Cari nama file, bank, atau periode"
              className="h-8 rounded-[8px] border-strong bg-surface-muted pl-8 text-xs shadow-none"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-[8px] border-strong bg-app text-primary shadow-none hover:bg-surface-raised"
              onClick={onReset}
            >
              <CupertinoIcon name="close" className="size-3.5" />
              Reset data
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-[13px] border border-subtle">
          <CupertinoTable
            columnsClassName="grid-cols-[minmax(240px,1.3fr)_90px_120px_90px_150px_100px_120px]"
            minWidthClassName="min-w-[980px]"
            hasRows={files.length > 0}
            emptyState={
              <div className="px-5 py-14 text-center text-sm text-tertiary">
                Belum ada file PDF yang diupload.
              </div>
            }
            headers={[
              { key: "name", label: "Nama file" },
              { key: "bank", label: "Bank" },
              { key: "period", label: "Periode" },
              { key: "size", label: "Ukuran" },
              { key: "upload", label: "Upload" },
              { key: "count", label: "Transaksi" },
              { key: "status", label: "Status" },
            ]}
          >
            {files.map((file) => (
              <div
                key={file.name}
                className={`grid grid-cols-[minmax(240px,1.3fr)_90px_120px_90px_150px_100px_120px] items-center gap-3 px-[18px] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS} text-[11px] text-secondary transition hover:bg-surface-muted`}
              >
                <span className="truncate pr-3 text-sm font-medium text-primary">
                  {file.name}
                </span>
                <span>
                  <BankChip label={file.bank} />
                </span>
                <span>{formatStatementPeriod(file.statementPeriod)}</span>
                <span>{formatFileSize(file.size)}</span>
                <span>{formatShortDateTime(file.uploadedAt)}</span>
                <span>{file.transactionCount}</span>
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <StatusBadge status={file.status} />
                </span>
              </div>
            ))}
          </CupertinoTable>
        </div>
      </div>
    </div>
  );
}

function ReviewQueuePanel({
  files,
  selectedFileId,
  onSelect,
}: {
  files: UploadedPdfFile[];
  selectedFileId: string | null;
  onSelect: (fileId: string) => void;
}) {
  return (
    <div className="rounded-[13px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="px-[18px] py-3.5">
        <p className="text-[13px] font-semibold text-primary">Review queue</p>
        <p className="text-[11px] text-tertiary">
          Pilih file yang baru diimport untuk cek hasil parsing dan klasifikasinya sebelum dipindahkan ke processed.
        </p>
      </div>
      <div className="space-y-3 px-[18px] pb-[18px]">
        {files.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-strong bg-surface-muted px-4 py-10 text-center text-sm text-tertiary">
            Tidak ada file yang sedang menunggu review.
          </div>
        ) : null}
        {files.map((file) => {
          const isActive = selectedFileId === file.id;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelect(file.id)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors",
                isActive
                  ? "border-accent/25 bg-[var(--accent)]/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  : "border-subtle bg-surface-muted hover:bg-surface-raised",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-primary">{file.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-tertiary">
                    <BankChip label={file.bank} />
                    <span>{formatStatementPeriod(file.statementPeriod)}</span>
                  </div>
                </div>
                <StatusBadge status={file.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-tertiary">
                <span>{file.transactionCount} transaksi</span>
                <span>{file.issueCount} issue</span>
                <span>{formatRelativeTime(file.uploadedAt)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewDetailPanel({
  file,
  rows,
  onPreviewRaw,
  onReparse,
  onProcess,
  processDisabled,
  onDelete,
  onEditTransaction,
  onDeleteTransaction,
}: {
  file: UploadedPdfFile | null;
  rows: ReviewClassificationRow[];
  onPreviewRaw: () => void;
  onReparse: () => void;
  onProcess: () => void;
  processDisabled: boolean;
  onDelete: () => void;
  onEditTransaction: (transaction: ParsedTransaction) => void;
  onDeleteTransaction: (transaction: ParsedTransaction) => void;
}) {
  const summary = useMemo(() => {
    const stats = {
      total: rows.length,
      keywordMatched: 0,
      uncategorized: 0,
      debitTotal: 0,
    };

    for (const row of rows) {
      if (row.source === "keyword") {
        stats.keywordMatched += 1;
      }
      if (row.source === "uncategorized") {
        stats.uncategorized += 1;
      }
      if (row.type === "debit") {
        stats.debitTotal += row.amount;
      }
    }

    return stats;
  }, [rows]);

  return (
    <div className="rounded-[13px] bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
      <div className="px-[18px] py-3.5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-primary">Classification preview</p>
            <p className="text-[11px] leading-5 text-tertiary">
              {file
                ? `Preview hasil parsing untuk ${file.name}. Pastikan semua transaksi sudah punya category sebelum file masuk ke Transactions.`
                : "Pilih salah satu file review untuk melihat hasil parsing dan klasifikasi."}
            </p>
          </div>
          {file ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-[8px] border-strong bg-app text-primary shadow-none hover:bg-surface-raised" onClick={onPreviewRaw}>
                <CupertinoIcon name="paperclip" className="size-3.5" />
                Raw text
              </Button>
              <Button variant="outline" size="sm" className="rounded-[8px] border-strong bg-app text-primary shadow-none hover:bg-surface-raised" onClick={onReparse}>
                <CupertinoIcon name="repeat" className="size-3.5" />
                Re-parse
              </Button>
              <WorkspacePrimaryButton
                size="sm"
                disabled={processDisabled}
                onClick={onProcess}
              >
                <CupertinoIcon name="check" className="size-3.5" />
                Mark processed
              </WorkspacePrimaryButton>
              <Button variant="outline" size="sm" className="rounded-[8px] border-strong bg-danger/10 text-danger shadow-none hover:bg-danger/15 hover:text-danger" onClick={onDelete}>
                <CupertinoIcon name="close" className="size-3.5" />
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="space-y-5 px-[18px] pb-[18px]">
        {!file ? (
          <div className="rounded-[12px] border border-dashed border-strong bg-surface-muted px-4 py-14 text-center text-sm text-tertiary">
            Belum ada file yang dipilih untuk preview classification.
          </div>
        ) : (
          <>
            {summary.uncategorized > 0 ? (
              <div className="rounded-[12px] border border-danger/15 bg-danger/10 px-4 py-3 text-[11px] leading-5 text-danger">
                {summary.uncategorized} transaksi masih belum punya category. Lengkapi rules atau edit transaksi dulu sebelum file ditandai processed.
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-[12px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] px-4 py-3">
                <p className="text-[11px] text-tertiary">Total transactions</p>
                <p className="text-xl font-bold text-primary">{summary.total}</p>
              </div>
              <div className="rounded-[12px] bg-success/10 px-4 py-3">
                <p className="text-[11px] text-tertiary">Keyword matched</p>
                <p className="text-xl font-bold text-primary">{summary.keywordMatched}</p>
              </div>
              <div className="rounded-[12px] bg-danger/10 px-4 py-3">
                <p className="text-[11px] text-tertiary">Need category review</p>
                <p className="text-xl font-bold text-primary">{summary.uncategorized}</p>
              </div>
              <div className="rounded-[12px] bg-surface-muted px-4 py-3">
                <p className="text-[11px] text-tertiary">Debit total</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(summary.debitTotal)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-[13px] border border-subtle bg-surface">
                <CupertinoTable
                  columnsClassName="grid-cols-[90px_180px_minmax(240px,1fr)_140px_120px_96px]"
                  minWidthClassName="min-w-[1080px]"
                  hasRows={rows.length > 0}
                  headerClassName="bg-surface-muted dark:bg-surface"
                  bodyClassName="max-h-[460px] overflow-y-auto bg-surface"
                  emptyState={
                    <div className="px-5 py-14 text-center text-sm text-tertiary">
                      Belum ada transaksi hasil parsing untuk file ini.
                  </div>
                }
                headers={[
                  { key: "date", label: "Tanggal" },
                  { key: "merchant", label: "Merchant" },
                  { key: "description", label: "Deskripsi" },
                  { key: "category", label: "Category" },
                  { key: "amount", label: "Nominal" },
                  { key: "action", label: "Action", className: "text-right" },
                ]}
              >
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={`grid grid-cols-[90px_180px_minmax(240px,1fr)_140px_120px_96px] items-center gap-3 px-[18px] ${CUPERTINO_TABLE_ROW_HEIGHT_CLASS} text-[11px] text-secondary transition hover:bg-surface-muted`}
                  >
                    <span className="text-tertiary">{formatDate(row.date)}</span>
                    <span className="truncate pr-3 text-sm font-medium text-primary">
                      {row.merchantName}
                    </span>
                    <span className="truncate pr-5 text-secondary">{row.description}</span>
                    <span>
                      {row.categoryName ? (
                        row.categoryColor ? (
                          <CategoryChip
                            label={row.categoryName}
                            color={row.categoryColor}
                          />
                        ) : (
                          <CupertinoChip>{row.categoryName}</CupertinoChip>
                        )
                      ) : (
                        <span className="text-xs text-tertiary">Uncategorized</span>
                      )}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(row.amount)}
                    </span>
                    <CupertinoTableRowActions
                      actions={[
                        {
                          label: "Edit transaction",
                          icon: "settings",
                          onClick: () => onEditTransaction(row),
                        },
                        {
                          label: "Delete transaction",
                          icon: "close",
                          tone: "destructive",
                          onClick: () => onDeleteTransaction(row),
                        },
                      ]}
                    />
                  </div>
                ))}
              </CupertinoTable>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function FileWorkspace() {
  const {
    state,
    summary,
    isHydrated,
    isUploading,
    error,
    uploadFiles,
    resetAll,
    markFileProcessed,
    reparseFile,
    deleteFile,
    updateTransaction,
    deleteTransaction,
  } = useFileWorkspace();
  const { settings } = useAppSettings();
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedReviewFileId, setSelectedReviewFileId] = useState<string | null>(null);
  const [selectedRawFileId, setSelectedRawFileId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    description: "",
    type: "debit" as TransactionType,
    amount: "",
    balance: "",
  });
  const activeSelectedBank = selectedBank ?? settings.defaultBank;

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return state.files;
    }

    return state.files.filter((file) =>
      `${file.name} ${file.bank} ${file.statementPeriod ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [search, state.files]);

  const reviewFiles = useMemo(
    () => state.files.filter((file) => file.status === "review"),
    [state.files],
  );

  const activeReviewFileId = useMemo(() => {
    if (reviewFiles.length === 0) {
      return null;
    }

    if (selectedReviewFileId && reviewFiles.some((file) => file.id === selectedReviewFileId)) {
      return selectedReviewFileId;
    }

    return reviewFiles[0].id;
  }, [reviewFiles, selectedReviewFileId]);

  const selectedReviewFile = useMemo(
    () => reviewFiles.find((file) => file.id === activeReviewFileId) ?? null,
    [activeReviewFileId, reviewFiles],
  );

  const selectedReviewRows = useMemo<ReviewClassificationRow[]>(() => {
    if (!selectedReviewFile) {
      return [];
    }

    return state.transactions
      .filter((transaction) => transaction.sourceFile === selectedReviewFile.name)
      .map((transaction) => {
        const merchant = resolveTransactionMerchant(transaction, state.merchantMappings);
        const category = matchTransactionCategory(
          transaction,
          state.categories,
          state.merchantMappings,
        );
        const source: ClassificationSource = transaction.categoryId
          ? "manual"
          : category
            ? "keyword"
            : "uncategorized";

        return {
          ...transaction,
          merchantName: merchant.merchantName,
          categoryName: category?.name ?? null,
          categoryColor: category?.color ?? null,
          source,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedReviewFile, state.categories, state.merchantMappings, state.transactions]);

  const selectedReviewHasUncategorized = useMemo(
    () => selectedReviewRows.some((row) => row.source === "uncategorized"),
    [selectedReviewRows],
  );

  const selectedRawFile = useMemo(
    () => reviewFiles.find((file) => file.id === selectedRawFileId) ?? null,
    [reviewFiles, selectedRawFileId],
  );

  const selectedParsedTransactions = useMemo(
    () =>
      selectedReviewFile
        ? state.transactions.filter(
            (transaction) => transaction.sourceFile === selectedReviewFile.name,
          )
        : [],
    [selectedReviewFile, state.transactions],
  );

  const editingTransaction = useMemo(
    () =>
      selectedParsedTransactions.find(
        (transaction) => transaction.id === editingTransactionId,
      ) ?? null,
    [editingTransactionId, selectedParsedTransactions],
  );

  function startEditTransaction(transaction: ParsedTransaction) {
    setEditingTransactionId(transaction.id);
    setEditForm({
      date: toDateInputValue(transaction.date),
      description: transaction.description,
      type: transaction.type,
      amount: String(transaction.amount),
      balance: transaction.balance === null ? "" : String(transaction.balance),
    });
  }

  function submitTransactionEdit() {
    if (!editingTransaction) {
      return;
    }

    const amount = Number(editForm.amount);
    const balance = editForm.balance.trim() === "" ? null : Number(editForm.balance);

    if (
      !editForm.date ||
      !editForm.description.trim() ||
      Number.isNaN(amount) ||
      (balance !== null && Number.isNaN(balance))
    ) {
      return;
    }

    updateTransaction(editingTransaction.id, {
      date: new Date(editForm.date).toISOString(),
      description: editForm.description.trim(),
      type: editForm.type,
      amount,
      balance,
    });
    setEditingTransactionId(null);
  }

  function submitConfirmAction() {
    if (!confirmAction) {
      return;
    }

    if (confirmAction.kind === "process-file") {
      markFileProcessed(confirmAction.id);
    }

    if (confirmAction.kind === "delete-file") {
      if (selectedReviewFileId === confirmAction.id) {
        setSelectedReviewFileId(null);
      }
      if (selectedRawFileId === confirmAction.id) {
        setSelectedRawFileId(null);
      }
      deleteFile(confirmAction.id);
    }

    if (confirmAction.kind === "delete-transaction") {
      deleteTransaction(confirmAction.id);
    }

    setConfirmAction(null);
  }

  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar
        title="Import workspace"
        actions={
          <WorkspaceTopBarActionButton href="/transactions">
            Transactions
          </WorkspaceTopBarActionButton>
        }
      />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <UploadPanel
          onUpload={uploadFiles}
          isUploading={isUploading}
          error={error}
          selectedBank={activeSelectedBank}
          onBankChange={setSelectedBank}
        />

        {isHydrated && (
          <SummaryGrid
            totalFiles={summary.totalFiles}
            processed={summary.processed}
            review={summary.review}
            recent={summary.recent}
          />
        )}

        <ReviewDetailPanel
          file={selectedReviewFile}
          rows={selectedReviewRows}
          onPreviewRaw={() => {
            if (selectedReviewFile) {
              setSelectedRawFileId(selectedReviewFile.id);
            }
          }}
          onReparse={() => {
            if (selectedReviewFile) {
              reparseFile(selectedReviewFile.id);
            }
          }}
          onProcess={() => {
            if (selectedReviewFile && !selectedReviewHasUncategorized) {
              setConfirmAction({
                kind: "process-file",
                id: selectedReviewFile.id,
                label: selectedReviewFile.name,
              });
            }
          }}
          processDisabled={selectedReviewHasUncategorized}
          onDelete={() => {
            if (selectedReviewFile) {
              setConfirmAction({
                kind: "delete-file",
                id: selectedReviewFile.id,
                label: selectedReviewFile.name,
              });
            }
          }}
          onEditTransaction={startEditTransaction}
          onDeleteTransaction={(transaction) =>
            setConfirmAction({
              kind: "delete-transaction",
              id: transaction.id,
              label: transaction.description,
            })
          }
        />

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_340px]">
          <div className="space-y-3">
            <FileTable
              files={filteredFiles}
              search={search}
              onSearchChange={setSearch}
              onReset={resetAll}
            />
          </div>

          <div className="space-y-3">
            <ReviewQueuePanel
              files={reviewFiles}
              selectedFileId={activeReviewFileId}
              onSelect={setSelectedReviewFileId}
            />
          </div>
        </div>

        <CupertinoModal
          open={Boolean(editingTransaction)}
          onClose={() => setEditingTransactionId(null)}
          title="Edit transaction"
        >
          <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-3.5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-secondary">Date</label>
                <Input
                  type="date"
                  className="h-9 rounded-[9px] border-strong bg-surface-muted text-xs shadow-none"
                  value={editForm.date}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-secondary">Type</label>
                <div className="flex rounded-[8px] bg-surface-muted p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-[6px] px-3 py-1.5 text-[11px] font-medium transition",
                      editForm.type === "debit"
                        ? "bg-surface dark:bg-surface-raised text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none"
                        : "text-tertiary",
                    )}
                    onClick={() =>
                      setEditForm((current) => ({ ...current, type: "debit" }))
                    }
                  >
                    Debit
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "flex-1 rounded-[6px] px-3 py-1.5 text-[11px] font-medium transition",
                      editForm.type === "credit"
                        ? "bg-surface dark:bg-surface-raised text-primary shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:shadow-none"
                        : "text-tertiary",
                    )}
                    onClick={() =>
                      setEditForm((current) => ({ ...current, type: "credit" }))
                    }
                  >
                    Credit
                  </button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[11px] font-medium text-secondary">
                  Description
                </label>
                <Input
                  className="h-9 rounded-[9px] border-strong bg-surface-muted text-xs shadow-none"
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-secondary">Amount</label>
                <Input
                  inputMode="decimal"
                  className="h-9 rounded-[9px] border-strong bg-surface-muted text-xs shadow-none"
                  value={editForm.amount}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-secondary">Balance</label>
                <Input
                  inputMode="decimal"
                  placeholder="Kosongkan jika tidak ada"
                  className="h-9 rounded-[9px] border-strong bg-surface-muted text-xs shadow-none"
                  value={editForm.balance}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      balance: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 rounded-[9px] border-strong bg-surface px-3 text-primary shadow-none hover:bg-surface-muted"
              onClick={() => setEditingTransactionId(null)}
            >
              Cancel
            </Button>
            <WorkspacePrimaryButton
              type="button"
              onClick={submitTransactionEdit}
            >
              Save changes
            </WorkspacePrimaryButton>
          </div>
        </CupertinoModal>

        <Dialog
          open={Boolean(selectedRawFile)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedRawFileId(null);
            }
          }}
        >
          <DialogContent className="w-[calc(100vw-2rem)] max-w-[1400px] bg-popover sm:max-w-[1400px]">
            <DialogHeader>
              <DialogTitle>Raw text preview</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-xs text-muted-foreground">
                {selectedRawFile?.name ?? "File"}
              </div>
              <div className="max-h-[72vh] overflow-auto rounded-lg border border-border bg-slate-50 dark:bg-surface p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground">
                  {selectedRawFile?.rawText?.trim() ||
                    "Raw text belum tersedia untuk file ini."}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <CupertinoConfirmDialog
          open={Boolean(confirmAction)}
          onClose={() => setConfirmAction(null)}
          onConfirm={submitConfirmAction}
          title={
            confirmAction?.kind === "process-file"
              ? "Mark file as processed?"
              : confirmAction?.kind === "delete-file"
                ? "Delete file?"
                : "Delete transaction?"
          }
          description={
            confirmAction?.kind === "process-file"
              ? `${confirmAction.label} akan dipindahkan dari antrian review ke processed.`
              : confirmAction?.kind === "delete-file"
                ? `${confirmAction.label} beserta transaksi terkait akan dihapus dari workspace.`
                : "Row transaksi ini akan dihapus dari hasil parsing file yang sedang direview."
          }
          confirmLabel={confirmAction?.kind === "process-file" ? "Confirm" : "Delete"}
          tone={
            confirmAction?.kind === "delete-file" ||
            confirmAction?.kind === "delete-transaction"
              ? "destructive"
              : "default"
          }
        />
      </div>
    </main>
  );
}
