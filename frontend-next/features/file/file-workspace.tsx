"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Download,
  ChevronDown,
  Clock3,
  Pencil,
  FileCheck2,
  FileClock,
  FileSearch,
  FileText,
  FolderOpen,
  Inbox,
  RefreshCcw,
  RotateCcw,
  Search,
  CheckCheck,
  TableProperties,
  Trash2,
  Upload,
} from "lucide-react";

import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatRelativeTime,
  formatShortDateTime,
  formatStatementPeriod,
} from "@/lib/formatters";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
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
import { cn } from "@/lib/utils";
import type { ParsedTransaction, TransactionType, UploadedPdfFile } from "@/types/transaction";

const supportedBanks = [
  { value: "bca", label: "BCA", support: "supported" as const },
  { value: "mandiri", label: "Mandiri", support: "coming-soon" as const },
  { value: "bni", label: "BNI", support: "coming-soon" as const },
  { value: "bri", label: "BRI", support: "coming-soon" as const },
  { value: "cimb", label: "CIMB Niaga", support: "coming-soon" as const },
];

function getBankLabel(value: string) {
  return (
    supportedBanks.find((bank) => bank.value === value)?.label ?? "Pilih bank"
  );
}

function StatusBadge({ status }: { status: UploadedPdfFile["status"] }) {
  if (status === "processed") {
    return (
      <Badge
        variant="outline"
        className="border-emerald-200 bg-emerald-50 text-emerald-700"
      >
        Processed
      </Badge>
    );
  }

  return (
    <Link href="/file/review" aria-label="Open review queue">
      <Badge
        variant="outline"
        className="border-amber-200 bg-amber-50 text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100"
      >
        Review needed
      </Badge>
    </Link>
  );
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

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    void onUpload(files, selectedBank);
  }

  return (
    <Card className="gap-2 border-border bg-card">
      <CardHeader className="gap-2">
        <div className="space-y-1">
          <CardTitle>Upload mutasi rekening</CardTitle>
          <CardDescription>
            Pilih bank terlebih dulu, lalu tambahkan file PDF mutasi rekening
            untuk diproses ke dashboard MBG.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />

        <div
          className="rounded-xl border border-dashed border-border bg-muted/30 p-8 transition-colors data-[dragging=true]:border-indigo-300 data-[dragging=true]:bg-indigo-50/60"
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
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-background ring-1 ring-border">
              <Upload className="size-5 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drag and drop file PDF mutasi rekening
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                size="sm"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="size-4" />
                {isUploading ? "Memproses PDF..." : "Pilih file PDF"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "min-w-[148px] justify-between bg-background text-xs",
                      )}
                    />
                  }
                >
                  <span>{getBankLabel(selectedBank)}</span>
                  <ChevronDown className="size-4 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 bg-popover">
                  {supportedBanks.map((bank) => (
                    <DropdownMenuItem
                      key={bank.value}
                      onClick={() => onBankChange(bank.value)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{bank.label}</span>
                        {bank.support === "supported" ? (
                          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-700 ring-1 ring-emerald-200">
                            Supported
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 ring-1 ring-slate-200">
                            Soon
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog>
                <DialogTrigger render={<Button variant="outline" size="sm" />}>
                  <Inbox className="size-4" />
                  Lihat contoh format
                </DialogTrigger>
                <DialogContent
                  className="max-w-4xl bg-popover p-0"
                  showCloseButton
                >
                  <DialogHeader className="border-b px-5 pt-5 pb-4">
                    <DialogTitle>Contoh format mutasi rekening</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center px-5">
                    <div className="w-full max-w-[794px]">
                      <Image
                        src="/images/example-mutation.png"
                        alt="Contoh format file mutasi rekening"
                        width={794}
                        height={1123}
                        className="h-auto w-full rounded-lg border border-border bg-card"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {error ? (
              <p className="text-xs text-rose-600">{error}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                PDF akan diparse langsung di browser dan disimpan ke local
                storage.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card size="sm" className="border-border bg-muted/20">
            <CardHeader>
              <CardTitle>Format</CardTitle>
              <CardDescription>PDF mutasi rekening bank</CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="border-border bg-muted/20">
            <CardHeader>
              <CardTitle>Merge</CardTitle>
              <CardDescription>
                Gabung file baru ke data yang ada
              </CardDescription>
            </CardHeader>
          </Card>
          <Card size="sm" className="border-border bg-muted/20">
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Simpan state lokal di browser</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
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
  const summaryCards = [
    {
      title: "Total files",
      value: String(totalFiles),
      note: "PDF mutasi tersimpan",
      icon: FolderOpen,
      cardClassName: "border-indigo-200/80 bg-indigo-400/40",
      iconWrapClassName: "bg-indigo-100 ring-indigo-200/80",
      iconClassName: "text-indigo-500",
    },
    {
      title: "Processed",
      value: String(processed),
      note: "Siap dipakai ke transaksi",
      icon: FileCheck2,
      cardClassName: "border-emerald-200/80 bg-emerald-400/40",
      iconWrapClassName: "bg-emerald-100 ring-emerald-200/80",
      iconClassName: "text-emerald-500",
    },
    {
      title: "Pending review",
      value: String(review),
      note: "Cek hasil parsing PDF",
      icon: FileSearch,
      href: "/file/review",
      cardClassName: "border-amber-200/80 bg-amber-400/40",
      iconWrapClassName: "bg-amber-100 ring-amber-200/80",
      iconClassName: "text-amber-500",
    },
    {
      title: "Recent imports",
      value: String(recent),
      note: "Upload dalam 7 hari",
      icon: FileClock,
      cardClassName: "border-sky-200/80 bg-sky-400/40",
      iconWrapClassName: "bg-sky-100 ring-sky-200/80",
      iconClassName: "text-sky-500",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.title}
            className={cn("border-border bg-card", item.cardClassName)}
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardDescription>{item.title}</CardDescription>
                  <CardTitle className="mt-1 text-2xl">{item.value}</CardTitle>
                </div>
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl ring-1",
                    item.iconWrapClassName,
                  )}
                >
                  <Icon className={cn("size-4", item.iconClassName)} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              {"href" in item && item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                >
                  {item.note}
                </Link>
              ) : (
                <p>{item.note}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
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
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Daftar file PDF</CardTitle>
        <CardDescription>
          Semua file mutasi yang sudah diupload ke workspace MBG.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-2xl">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari nama file, bank, atau periode"
              className="h-6 border-border bg-background pl-8 text-xs"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              <Trash2 className="size-4" />
              Reset data
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama file</TableHead>
              <TableHead>Bank</TableHead>
              <TableHead>Periode</TableHead>
              <TableHead>Ukuran</TableHead>
              <TableHead>Upload</TableHead>
              <TableHead>Transaksi</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  Belum ada file PDF yang diupload.
                </TableCell>
              </TableRow>
            ) : null}
            {files.map((file) => (
              <TableRow key={file.name}>
                <TableCell className="font-medium text-foreground">
                  {file.name}
                </TableCell>
                <TableCell>{file.bank}</TableCell>
                <TableCell>
                  {formatStatementPeriod(file.statementPeriod)}
                </TableCell>
                <TableCell>{formatFileSize(file.size)}</TableCell>
                <TableCell>{formatShortDateTime(file.uploadedAt)}</TableCell>
                <TableCell>{file.transactionCount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <StatusBadge status={file.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ImportActivity({
  activities,
}: {
  activities: {
    id: string;
    title: string;
    note: string;
    createdAt: string;
    tone: "success" | "warning";
  }[];
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>Import activity</CardTitle>
        <CardDescription>
          Ringkasan proses import PDF terbaru untuk workspace ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            Belum ada aktivitas import. Upload PDF pertama untuk mulai memproses
            mutasi rekening.
          </div>
        ) : null}
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/20 px-3 py-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {item.title}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {item.note}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="size-3.5" />
              {formatRelativeTime(item.createdAt)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function FileBackupWorkspace() {
  const {
    processedBackupState,
    backupToJson,
    restoreFromJson,
    isRestoring,
    error,
  } = useFileWorkspace();
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

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
                <BreadcrumbLink render={<Link href="/file" />}>File</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Backup &amp; Restore</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Backup &amp; Restore
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Simpan salinan data workspace MBG ke JSON atau pulihkan kembali
              data dari file backup lokal.
            </p>
          </div>
        </section>

        <Separator />

        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            void restoreFromJson(file);
            event.currentTarget.value = "";
          }}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Backup workspace</CardTitle>
              <CardDescription>
                Unduh hanya data yang sudah berstatus processed ke satu file
                JSON, termasuk kategori, rules, dan merchant mapping workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                {processedBackupState.files.length} file processed,{" "}
                {processedBackupState.transactions.length} transaksi, dan{" "}
                {processedBackupState.activities.length} activity, serta{" "}
                {processedBackupState.categories.length} kategori dan{" "}
                {processedBackupState.merchantMappings.length} merchant mapping
                akan ikut masuk ke backup.
              </div>
              <Button onClick={backupToJson}>
                <Download className="size-4" />
                Backup processed JSON
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Restore workspace</CardTitle>
              <CardDescription>
                Pulihkan data dari file JSON backup. Data aktif di browser akan
                ditimpa oleh isi backup yang dipilih, termasuk merchant mapping
                yang sudah pernah disimpan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
   
              {error ? (
                <p className="text-sm text-rose-600">{error}</p>
              ) : null}
              <Button
                variant="outline"
                disabled={isRestoring}
                onClick={() => restoreInputRef.current?.click()}
              >
                <RotateCcw className="size-4" />
                {isRestoring ? "Restoring..." : "Restore JSON"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
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
  } = useFileWorkspace();
  const { settings } = useAppSettings();
  const [search, setSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
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
                <BreadcrumbPage>File</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              File workspace
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Kelola semua file PDF mutasi rekening yang akan diproses ke dalam
                dashboard MBG.
              </p>
              <Link
                href="/file/review"
                className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
              >
                Buka review queue
              </Link>
            </div>
          </div>
        </section>

        <Separator />

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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <FileTable
              files={filteredFiles}
              search={search}
              onSearchChange={setSearch}
              onReset={resetAll}
            />
          </div>

          <div className="space-y-6">
            <ImportActivity activities={state.activities} />
          </div>
        </div>
      </div>
    </main>
  );
}

export function FileReviewWorkspace() {
  const {
    state,
    markFileProcessed,
    reparseFile,
    deleteFile,
    updateTransaction,
    deleteTransaction,
  } = useFileWorkspace();
  const [selectedRawFileId, setSelectedRawFileId] = useState<string | null>(null);
  const [selectedParsedFileId, setSelectedParsedFileId] = useState<string | null>(
    null
  );
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null
  );
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    description: "",
    type: "debit" as TransactionType,
    amount: "",
    balance: "",
  });

  const reviewFiles = useMemo(
    () => state.files.filter((file) => file.status === "review"),
    [state.files],
  );

  const selectedRawFile = useMemo(
    () => reviewFiles.find((file) => file.id === selectedRawFileId) ?? null,
    [reviewFiles, selectedRawFileId],
  );

  const selectedParsedFile = useMemo(
    () => reviewFiles.find((file) => file.id === selectedParsedFileId) ?? null,
    [reviewFiles, selectedParsedFileId],
  );

  const selectedParsedTransactions = useMemo(() => {
    if (!selectedParsedFile) {
      return [];
    }

    return state.transactions.filter(
      (transaction) => transaction.sourceFile === selectedParsedFile.name
    );
  }, [selectedParsedFile, state.transactions]);

  const editingTransaction = useMemo(
    () =>
      selectedParsedTransactions.find(
        (transaction) => transaction.id === editingTransactionId
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
      balance:
        transaction.balance === null ? "" : String(transaction.balance),
    });
  }

  function submitTransactionEdit() {
    if (!editingTransaction) {
      return;
    }

    const amount = Number(editForm.amount);
    const balance =
      editForm.balance.trim() === "" ? null : Number(editForm.balance);

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
      if (selectedParsedFileId === confirmAction.id) {
        setSelectedParsedFileId(null);
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
                <BreadcrumbLink render={<Link href="/file" />}>File</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Review Queue</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Review queue
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Preview file yang masih perlu dicek sebelum dianggap berhasil
              diproses.
            </p>
          </div>
        </section>

        <Separator />

        <Card className="border-amber-200/70 bg-card">
          <CardHeader>
            <CardTitle>Pending review files</CardTitle>
            <CardDescription>
              File yang belum lolos parsing penuh dan perlu dicek lebih dulu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama file</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Issue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewFiles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Belum ada file yang masuk antrian review.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {reviewFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium text-foreground">
                        {file.name}
                      </TableCell>
                      <TableCell>{file.bank}</TableCell>
                      <TableCell>
                        {formatStatementPeriod(file.statementPeriod)}
                      </TableCell>
                      <TableCell>{formatShortDateTime(file.uploadedAt)}</TableCell>
                      <TableCell>{file.issueCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={file.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={<Button variant="outline" size="icon-sm" />}
                              onClick={() => setSelectedRawFileId(file.id)}
                            >
                              <FileText className="size-4" />
                              <span className="sr-only">Preview raw text</span>
                            </TooltipTrigger>
                            <TooltipContent>Preview raw text</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={<Button variant="outline" size="icon-sm" />}
                              onClick={() => setSelectedParsedFileId(file.id)}
                            >
                              <TableProperties className="size-4" />
                              <span className="sr-only">
                                View parsed transactions
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              View parsed transactions
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={<Button variant="outline" size="icon-sm" />}
                              onClick={() => reparseFile(file.id)}
                            >
                              <RefreshCcw className="size-4" />
                              <span className="sr-only">Re-parse file</span>
                            </TooltipTrigger>
                            <TooltipContent>Re-parse file</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="text-emerald-600 hover:text-emerald-700"
                                />
                              }
                              onClick={() =>
                                setConfirmAction({
                                  kind: "process-file",
                                  id: file.id,
                                  label: file.name,
                                })
                              }
                            >
                              <CheckCheck className="size-4" />
                              <span className="sr-only">
                                Mark as processed
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Mark as processed</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="outline"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                />
                              }
                              onClick={() =>
                                setConfirmAction({
                                  kind: "delete-file",
                                  id: file.id,
                                  label: file.name,
                                })
                              }
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">Delete file</span>
                            </TooltipTrigger>
                            <TooltipContent>Delete file</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 bg-card">
          <CardHeader>
            <CardTitle>Parsed transaction preview</CardTitle>
            <CardDescription>
              {selectedParsedFile
                ? `Menampilkan hasil parsing untuk ${selectedParsedFile.name}.`
                : "Pilih action view parsed transactions pada salah satu file untuk melihat detail hasil parsing."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!selectedParsedFile ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada file yang dipilih untuk preview transaksi.
                    </TableCell>
                  </TableRow>
                ) : null}
                {selectedParsedFile &&
                selectedParsedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Belum ada transaksi hasil parsing untuk file ini.
                    </TableCell>
                  </TableRow>
                ) : null}
                {selectedParsedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell className="max-w-[420px] truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="capitalize">
                      {transaction.type}
                    </TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatCurrency(transaction.balance)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={<Button variant="outline" size="icon-sm" />}
                            onClick={() => startEditTransaction(transaction)}
                          >
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit transaction</span>
                          </TooltipTrigger>
                          <TooltipContent>Edit transaction</TooltipContent>
                        </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                              <Button
                                variant="outline"
                                size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                />
                              }
                            onClick={() =>
                              setConfirmAction({
                                kind: "delete-transaction",
                                id: transaction.id,
                                label: transaction.description,
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                            <span className="sr-only">Delete transaction</span>
                          </TooltipTrigger>
                          <TooltipContent>Delete transaction</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
              <div className="max-h-[72vh] overflow-auto rounded-lg border border-border bg-slate-50 p-4">
                <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-6 text-foreground">
                  {selectedRawFile?.rawText?.trim() ||
                    "Raw text belum tersedia untuk file ini."}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(editingTransaction)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTransactionId(null);
            }
          }}
        >
          <DialogContent className="max-w-xl bg-popover">
            <DialogHeader>
              <DialogTitle>Edit transaction</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground">
                  Date
                </label>
                <Input
                  type="date"
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
                <label className="text-xs font-medium text-foreground">
                  Type
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={editForm.type === "debit" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditForm((current) => ({
                        ...current,
                        type: "debit",
                      }))
                    }
                  >
                    Debit
                  </Button>
                  <Button
                    type="button"
                    variant={editForm.type === "credit" ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      setEditForm((current) => ({
                        ...current,
                        type: "credit",
                      }))
                    }
                  >
                    Credit
                  </Button>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-medium text-foreground">
                  Description
                </label>
                <Input
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
                <label className="text-xs font-medium text-foreground">
                  Amount
                </label>
                <Input
                  inputMode="decimal"
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
                <label className="text-xs font-medium text-foreground">
                  Balance
                </label>
                <Input
                  inputMode="decimal"
                  placeholder="Kosongkan jika tidak ada"
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
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingTransactionId(null)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={submitTransactionEdit}>
                Save changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(confirmAction)}
          onOpenChange={(open) => {
            if (!open) {
              setConfirmAction(null);
            }
          }}
        >
          <AlertDialogContent className="bg-popover" size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction?.kind === "process-file" && "Mark file as processed?"}
                {confirmAction?.kind === "delete-file" && "Delete file?"}
                {confirmAction?.kind === "delete-transaction" &&
                  "Delete transaction?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction?.kind === "process-file" &&
                  `${confirmAction.label} akan dipindahkan dari review queue ke processed.`}
                {confirmAction?.kind === "delete-file" &&
                  `${confirmAction.label} beserta transaksi terkait akan dihapus dari workspace.`}
                {confirmAction?.kind === "delete-transaction" &&
                  "Row transaksi ini akan dihapus dari hasil parsing file yang sedang direview."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className={
                  confirmAction?.kind === "delete-file" ||
                  confirmAction?.kind === "delete-transaction"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : undefined
                }
                onClick={submitConfirmAction}
              >
                {confirmAction?.kind === "process-file" && "Confirm"}
                {confirmAction?.kind === "delete-file" && "Delete"}
                {confirmAction?.kind === "delete-transaction" && "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  );
}
