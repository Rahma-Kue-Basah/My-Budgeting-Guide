"use client";

import { useRef, useState } from "react";

interface UploadDropzoneProps {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}

export function UploadDropzone({
  disabled = false,
  onFilesSelected,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validateFiles(fileList: FileList | null): File[] {
    const files = Array.from(fileList ?? []);
    const invalidFile = files.find(
      (file) => file.type !== "application/pdf" && !file.name.endsWith(".pdf")
    );

    if (invalidFile) {
      setLocalError(`File "${invalidFile.name}" bukan PDF.`);
      return [];
    }

    setLocalError(null);
    return files;
  }

  function handleIncomingFiles(fileList: FileList | null) {
    const files = validateFiles(fileList);

    if (files.length > 0) {
      onFilesSelected(files);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) {
            setIsDragging(true);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!disabled) {
            handleIncomingFiles(event.dataTransfer.files);
          }
        }}
        className={[
          "flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-6 py-8 text-center transition",
          isDragging
            ? "border-emerald-500 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/60",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 text-2xl text-white">
          PDF
        </div>
        <h2 className="text-xl font-semibold text-slate-950">
          Upload mutasi rekening BCA
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          Drag and drop file PDF ke area ini, atau klik untuk memilih file.
          Upload dapat dilakukan bertahap dan data baru akan digabung otomatis.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={disabled}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed"
          >
            Browse PDF
          </button>
          <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            Client-side only
          </span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          handleIncomingFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />

      {localError ? (
        <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {localError}
        </p>
      ) : null}
    </section>
  );
}
