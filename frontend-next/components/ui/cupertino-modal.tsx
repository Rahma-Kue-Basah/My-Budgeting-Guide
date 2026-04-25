"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { cn } from "@/lib/utils";

type CupertinoModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  bodyClassName?: string;
};

export function CupertinoModal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidthClassName = "max-w-[460px]",
  bodyClassName,
}: CupertinoModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[90vh] w-full overflow-y-auto rounded-[20px] bg-app text-primary shadow-[0_32px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.6)]",
          maxWidthClassName,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center justify-center px-5 pt-[18px] pb-3">
          <span className="text-[15px] font-semibold text-primary">{title}</span>
          <button
            type="button"
            className="absolute top-3.5 right-4 flex size-7 items-center justify-center rounded-full bg-surface-raised text-secondary hover:bg-surface-muted"
            onClick={onClose}
          >
            <CupertinoIcon name="close" className="size-3.5" />
          </button>
        </div>

        <div className={cn("flex flex-col gap-2.5 px-4 pb-5 text-primary", bodyClassName)}>
          {children}
        </div>
        {footer ? (
          <div className="border-t border-subtle bg-app px-4 py-3 text-primary">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
