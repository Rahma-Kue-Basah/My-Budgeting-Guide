"use client";

import type { ReactNode } from "react";

import { CupertinoIcon, type CupertinoIconName } from "@/components/icons/cupertino-icon";
import { cn } from "@/lib/utils";

type CupertinoTableRowAction = {
  label: string;
  onClick: () => void;
  icon: CupertinoIconName;
  tone?: "default" | "destructive";
  disabled?: boolean;
  children?: ReactNode;
};

export function CupertinoTableRowActions({
  actions,
  className,
}: {
  actions: CupertinoTableRowAction[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-[68px] items-center justify-end gap-1.5 justify-self-end",
        className,
      )}
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          aria-label={action.label}
          onClick={(event) => {
            event.stopPropagation();
            action.onClick();
          }}
          disabled={action.disabled}
          className={cn(
            "flex size-7 items-center justify-center rounded-[7px] border bg-white dark:bg-[#1c1c1e] transition-colors disabled:pointer-events-none disabled:opacity-50",
            action.tone === "destructive"
              ? "border-[#ff453a]/20 text-[#ff453a] hover:bg-[#fff5f5] dark:hover:bg-[#ff453a]/10"
              : "border-black/10 dark:border-white/10 text-[#636366] dark:text-[#8e8e93] hover:bg-[#f7f7f8] dark:hover:bg-[#2c2c2e]",
          )}
        >
          {action.children ?? (
            <CupertinoIcon name={action.icon} className="size-[13px]" />
          )}
        </button>
      ))}
    </div>
  );
}
