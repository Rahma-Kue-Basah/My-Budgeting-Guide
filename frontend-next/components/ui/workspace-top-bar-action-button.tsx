import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { cn } from "@/lib/utils";

type WorkspaceTopBarActionButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    tone?: "primary" | "dark" | "white" | "secondary" | "destructive";
    size?: "default" | "sm";
    href?: string;
  };

export function WorkspaceTopBarActionButton({
  className,
  children,
  tone = "primary",
  size = "default",
  href,
  ...props
}: WorkspaceTopBarActionButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
    size === "sm"
      ? "h-7 rounded-[7px] px-2 text-[10px]"
      : "h-9 rounded-[9px] px-3 text-sm",
    (tone === "primary" || tone === "dark") &&
      "bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-none hover:bg-[color-mix(in_srgb,var(--text-primary)_88%,black)] dark:hover:bg-surface-raised",
    (tone === "white" || tone === "secondary") &&
      "border border-strong bg-surface text-primary shadow-none hover:bg-surface-muted dark:hover:bg-surface-raised",
    tone === "destructive" &&
      "bg-[var(--danger)] text-white shadow-none hover:bg-[color-mix(in_srgb,var(--danger)_88%,black)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <CupertinoActionButton
      tone={tone}
      className={cn(
        size === "sm"
          ? "h-7 rounded-[7px] px-2 text-[10px]"
          : "h-9 rounded-[9px] px-3 text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </CupertinoActionButton>
  );
}
