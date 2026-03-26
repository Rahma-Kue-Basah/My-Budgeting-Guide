"use client";

import { CheckCircle2, Clock3, FileText } from "lucide-react";
import { UploadDropzone } from "@/components/file/upload-dropzone";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardState } from "@/hooks/use-dashboard-state";
import { formatDateTime } from "@/lib/formatters";

export default function FileUploadPage() {
  const { errorMessage, handleFilesSelected, isHydrated, isParsing, storedState, warnings } =
    useDashboardState();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Menyiapkan data...
      </div>
    );
  }

  return (
    <AppShell
      title="Upload File"
      subtitle="Halaman tool upload dengan nuansa produk lokal modern."
      actions={
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]"
        >
          Tambah file
        </Button>
      }
    >
      <div className="space-y-6">
        <UploadDropzone
          disabled={isParsing}
          onFilesSelected={handleFilesSelected}
        />

        {isParsing ? (
          <div className="rounded-[24px] border border-cyan-200/70 bg-cyan-50/80 px-5 py-4 text-sm text-cyan-800">
            Memproses file PDF dan mengekstrak transaksi...
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[24px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-[24px] border border-amber-200/70 bg-amber-50/80 px-5 py-4 text-sm text-amber-800">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        <Card className="rounded-[24px] border-white/70 bg-white/85">
          <CardHeader>
            <CardTitle>File activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {storedState.uploadedFiles.length === 0 ? (
              <div className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.95))] p-5 text-sm text-slate-500">
                Belum ada file yang diupload. Tambahkan PDF pertama Anda untuk mulai memproses data.
              </div>
            ) : null}
            {storedState.uploadedFiles.slice(0, 2).map((file) => {
              const isProcessed = file.transactionCount > 0;

              return (
                <div
                  key={file.id}
                  className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,250,255,0.95))] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <FileText className="size-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{file.name}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDateTime(file.addedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isProcessed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
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
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-slate-500">Ukuran</p>
                      <p className="mt-1 font-semibold text-slate-900">PDF</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-slate-500">Transaksi</p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {file.transactionCount}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
