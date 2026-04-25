"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CupertinoChipTone =
  | "neutral"
  | "status-success"
  | "status-warning"
  | "bank"
  | "indigo"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet";

const chipToneStyles: Record<CupertinoChipTone, string> = {
  neutral: "border-subtle bg-surface-muted text-secondary",
  "status-success": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-300",
  "status-warning": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-300",
  bank: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-300",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/25 dark:bg-indigo-400/12 dark:text-indigo-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/25 dark:bg-sky-400/12 dark:text-sky-300",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/25 dark:bg-emerald-400/12 dark:text-emerald-300",
  amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/25 dark:bg-amber-400/12 dark:text-amber-300",
  rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/25 dark:bg-rose-400/12 dark:text-rose-300",
  violet: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/25 dark:bg-violet-400/12 dark:text-violet-300",
};

type CupertinoChipProps = {
  children: ReactNode;
  tone?: CupertinoChipTone;
  className?: string;
};

export function CupertinoChip({
  children,
  tone = "neutral",
  className,
}: CupertinoChipProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center justify-center rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap",
        chipToneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
