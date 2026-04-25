"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type CupertinoActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "dark" | "white";
};

export function CupertinoActionButton({
  className,
  tone = "dark",
  type = "button",
  ...props
}: CupertinoActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[9px] px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        tone === "dark"
          ? "bg-[#1c1c1e] dark:bg-[#3a3a3c] text-white shadow-none hover:bg-black dark:hover:bg-[#48484a]"
          : "border border-black/10 dark:border-white/10 bg-white dark:bg-[#2c2c2e] text-[#1c1c1e] dark:text-[#f2f2f7] shadow-none hover:bg-[#f7f7f8] dark:hover:bg-[#3a3a3c]",
        className,
      )}
      {...props}
    />
  );
}
