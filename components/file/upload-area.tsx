"use client";

import { Upload } from "lucide-react";

export function UploadArea({
  disabled = false,
  onFilesSelected,
}: {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
}) {
  function validateFiles(fileList: FileList | null) {
    return Array.from(fileList ?? []).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
    );
  }

  return (
    <label
      className={[
        "panel-surface flex min-h-64 cursor-pointer flex-col items-center justify-center border-dashed px-6 py-12 text-center",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-primary/30 hover:bg-accent/20",
      ].join(" ")}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (disabled) {
          return;
        }

        const files = validateFiles(event.dataTransfer.files);
        if (files.length > 0) {
          onFilesSelected(files);
        }
      }}
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-border/80 bg-background">
        <Upload className="size-5 text-primary" />
      </div>
      <p className="text-base font-semibold text-foreground">
        Drag &amp; drop PDF atau klik untuk upload
      </p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        File akan diproses di browser dan digabung ke data yang sudah ada.
      </p>
      <input
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const files = validateFiles(event.target.files);
          if (files.length > 0) {
            onFilesSelected(files);
          }
          event.currentTarget.value = "";
        }}
      />
    </label>
  );
}
