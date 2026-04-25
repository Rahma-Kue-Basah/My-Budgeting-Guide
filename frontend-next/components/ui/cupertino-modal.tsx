"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";

type CupertinoModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function CupertinoModal({
  open,
  onClose,
  title,
  children,
  maxWidthClassName = "max-w-[460px]",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto rounded-[20px] bg-[#f2f2f4] dark:bg-[#1c1c1e] shadow-[0_32px_100px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_100px_rgba(0,0,0,0.6)] ${maxWidthClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center justify-center px-5 pt-[18px] pb-3">
          <span className="text-[15px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{title}</span>
          <button
            type="button"
            className="absolute top-3.5 right-4 flex size-7 items-center justify-center rounded-full bg-black/10 dark:bg-white/10"
            onClick={onClose}
          >
            <CupertinoIcon name="close" className="size-3.5 text-[#636366] dark:text-[#8e8e93]" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pb-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
