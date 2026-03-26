import { MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/formatters";
import type { UploadedPdfFile } from "@/types/transaction";

const statusStyles = {
  processed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
} as const;

export function FileList({ files }: { files: UploadedPdfFile[] }) {
  if (files.length === 0) {
    return (
      <div className="rounded-[24px] border border-white/70 bg-white/85 px-4 py-12 text-center text-sm text-slate-500 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
        Belum ada file yang diupload.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/70 bg-white/85 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-slate-200/80 bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead>Nama file</TableHead>
            <TableHead>Ukuran</TableHead>
            <TableHead>Tanggal upload</TableHead>
            <TableHead>Jumlah transaksi</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const isProcessed = file.transactionCount > 0;

            return (
              <TableRow key={file.id} className="border-slate-100">
                <TableCell className="font-medium text-foreground">{file.name}</TableCell>
                <TableCell>PDF</TableCell>
                <TableCell>{formatDateTime(file.addedAt)}</TableCell>
                <TableCell>{file.transactionCount}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isProcessed ? statusStyles.processed : statusStyles.pending
                    }`}
                  >
                    {isProcessed ? "Processed" : "Pending review"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-9 rounded-xl border-slate-200 bg-white"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
