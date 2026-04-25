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
  neutral: "border-black/[0.08] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] text-[#636366] dark:text-[#8e8e93]",
  "status-success": "border-emerald-200 bg-emerald-50 text-emerald-700",
  "status-warning": "border-amber-200 bg-amber-50 text-amber-700",
  bank: "border-sky-200 bg-sky-50 text-sky-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
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
