"use client";

import type { ReactNode } from "react";
import { useId, useState } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { Button } from "@/components/ui/button";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { cn } from "@/lib/utils";

export const FILTER_INPUT_CLASS_NAME =
  "h-10 rounded-[10px] border-subtle bg-surface-muted shadow-none focus-visible:ring-[var(--accent)]/30";

type CollapsibleFilterPanelProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  defaultOpen?: boolean;
  activeCount?: number;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CollapsibleFilterPanel({
  children,
  title = "Filters",
  description,
  defaultOpen = true,
  activeCount,
  actions,
  footer,
  className,
  contentClassName,
}: CollapsibleFilterPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[13px] border border-subtle bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 p-[14px] sm:p-[18px]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          onClick={() => setOpen((current) => !current)}
          className="group flex min-w-0 flex-1 items-start gap-3 rounded-[12px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30"
        >
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-muted text-accent">
            <CupertinoIcon name="list" className="size-4" />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] font-semibold text-primary">
                {title}
              </span>
              {typeof activeCount === "number" && activeCount > 0 ? (
                <CupertinoChip tone="neutral">
                  {activeCount} active
                </CupertinoChip>
              ) : null}
            </span>
            {description ? (
              <span className="block text-[11px] leading-5 text-tertiary">
                {description}
              </span>
            ) : null}
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={open ? "Collapse filters" : "Expand filters"}
            aria-expanded={open}
            aria-controls={contentId}
            onClick={() => setOpen((current) => !current)}
            className="size-8 rounded-full border-subtle bg-surface-muted text-tertiary shadow-none hover:bg-surface-raised hover:text-primary"
          >
            <CupertinoIcon
              name="chevronDown"
              className={cn("size-4 transition-transform", open && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id={contentId}
          className={cn(
            "border-t border-subtle px-[14px] pt-4 pb-[14px] sm:px-[18px] sm:pb-[18px]",
            contentClassName,
          )}
        >
          {children}
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

export function FilterPanelGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function FilterPanelField({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <label className={cn("space-y-2", className)}>
      <span className="text-[11px] font-medium text-tertiary">{label}</span>
      {children}
    </label>
  );
}

export function FilterPanelActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {children}
    </div>
  );
}
