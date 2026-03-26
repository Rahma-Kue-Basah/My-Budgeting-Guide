"use client";

import { useRef } from "react";
import { FileBadge2, Sparkles, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function UploadDropzone({
  disabled = false,
  onFilesSelected,
}: {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
    );

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }

  return (
    <Card className="overflow-hidden rounded-[28px] border-white/70 bg-white/85 p-6 sm:p-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div
          className="rounded-[24px] border border-dashed border-violet-200 bg-[linear-gradient(135deg,rgba(139,92,246,0.10),rgba(34,211,238,0.08),rgba(236,72,153,0.08))] p-8 text-center sm:p-10"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();

            if (!disabled) {
              handleFiles(event.dataTransfer.files);
            }
          }}
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-[20px] bg-white text-violet-700 shadow-[0_16px_34px_rgba(99,102,241,0.14)]">
            <UploadCloud className="size-7" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
            Drop file PDF mutasi ke sini
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
            Gunakan area ini untuk upload batch baru. File akan dibaca di browser,
            dipetakan ke transaksi, lalu langsung masuk ke dashboard interaktif.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
              className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]"
            >
              Pilih file PDF
            </Button>
            <Button
              variant="outline"
              disabled={disabled}
              className="h-11 rounded-2xl border-white/80 bg-white/80 px-5"
            >
              Upload bertahap didukung
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={(event) => {
              handleFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,255,0.96))] p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Upload checklist</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-500">
                  <li>PDF readable, bukan screenshot hasil scan.</li>
                  <li>Satu file bisa berisi multi halaman mutasi.</li>
                  <li>Batch baru bisa digabung tanpa reset data.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,255,0.96))] p-5">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <FileBadge2 className="size-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Preview panel</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Setelah upload, status parsing, jumlah transaksi, dan warning
                  akan langsung muncul di halaman ini.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
