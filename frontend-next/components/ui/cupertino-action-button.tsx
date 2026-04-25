"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type CupertinoActionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "dark" | "white" | "secondary" | "destructive";
};

export function CupertinoActionButton({
  className,
  tone = "primary",
  type = "button",
  ...props
}: CupertinoActionButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded-[9px] px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        (tone === "primary" || tone === "dark") &&
          "bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-none hover:bg-[color-mix(in_srgb,var(--text-primary)_88%,black)] dark:hover:bg-surface-raised",
        (tone === "white" || tone === "secondary") &&
          "border border-strong bg-surface text-primary shadow-none hover:bg-surface-muted dark:hover:bg-surface-raised",
        tone === "destructive" &&
          "bg-[var(--danger)] text-white shadow-none hover:bg-[color-mix(in_srgb,var(--danger)_88%,black)]",
        className,
      )}
      {...props}
    />
  );
}
