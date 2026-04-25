"use client";

import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoModal } from "@/components/ui/cupertino-modal";

type CupertinoConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "destructive";
};

export function CupertinoConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = "default",
}: CupertinoConfirmDialogProps) {
  return (
    <CupertinoModal open={open} onClose={onClose} title={title}>
      <div className="rounded-[12px] bg-surface dark:bg-surface-muted px-4 py-4">
        <p className="text-sm leading-6 text-secondary">{description}</p>
      </div>
      <div className="flex justify-end gap-2">
        <CupertinoActionButton tone="white" onClick={onClose}>
          Cancel
        </CupertinoActionButton>
        <CupertinoActionButton
          className={
            tone === "destructive"
              ? "bg-danger text-white hover:bg-danger/90"
              : undefined
          }
          onClick={onConfirm}
        >
          {confirmLabel}
        </CupertinoActionButton>
      </div>
    </CupertinoModal>
  );
}
