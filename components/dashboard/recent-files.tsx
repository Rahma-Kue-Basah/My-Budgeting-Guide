import Link from "next/link";
import { CheckCircle2, Clock3, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import type { UploadedPdfFile } from "@/types/transaction";

const statusStyles = {
  processed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
} as const;

export function RecentFiles({ files }: { files: UploadedPdfFile[] }) {
  return (
    <Card className="rounded-[24px] border-white/70 bg-white/85">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent files</CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            Aktivitas file terbaru yang sudah masuk ke workspace.
          </p>
        </div>
        <Link
          href="/file/list"
          className="text-sm font-medium text-violet-700 transition-colors hover:text-violet-800"
        >
          Lihat semua
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {files.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.95))] p-5 text-sm text-slate-500">
            Belum ada file PDF yang diproses.
          </div>
        ) : null}
        {files.slice(0, 3).map((file) => {
          const isProcessed = file.transactionCount > 0;

          return (
            <div
              key={file.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.95))] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <FolderOpen className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(file.addedAt)} • PDF document
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {file.transactionCount} transaksi
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                    isProcessed ? statusStyles.processed : statusStyles.pending
                  }`}
                >
                  {isProcessed ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <Clock3 className="size-3.5" />
                  )}
                  {isProcessed ? "Processed" : "Pending review"}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
