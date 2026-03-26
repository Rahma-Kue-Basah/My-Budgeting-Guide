import { formatDateTime } from "@/lib/formatters";
import type { UploadedPdfFile } from "@/types/transaction";

interface FileHistoryProps {
  files: UploadedPdfFile[];
}

export function FileHistory({ files }: FileHistoryProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Riwayat upload</h2>
          <p className="text-sm text-slate-600">
            File PDF yang sudah diproses dan digabung ke dashboard.
          </p>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          Belum ada file yang diproses.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {files.map((file) => (
            <article
              key={file.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium text-slate-950">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    Diproses pada {formatDateTime(file.addedAt)}
                  </p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                  {file.transactionCount} transaksi
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
