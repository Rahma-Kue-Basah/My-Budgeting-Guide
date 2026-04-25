"use client";

import { CupertinoIcon, type CupertinoIconName } from "@/components/icons/cupertino-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CupertinoSelectOption = {
  label: string;
  value: string;
  leadingIcon?: CupertinoIconName;
  leadingLabel?: string;
  leadingColor?: string;
  leadingClassName?: string;
  badgeLabel?: string;
  badgeTone?: "neutral" | "success";
};

type CupertinoSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: CupertinoSelectOption[];
  icon: CupertinoIconName;
  minWidthClassName?: string;
  ariaLabel?: string;
};

export function CupertinoSelect({
  value,
  onChange,
  options,
  icon,
  minWidthClassName = "min-w-[150px]",
  ariaLabel,
}: CupertinoSelectProps) {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0] ?? null;

  function renderLeading(option: CupertinoSelectOption | null, isSelected: boolean) {
    if (!option) {
      return (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[var(--accent)]">
          <CupertinoIcon name={icon} className="size-3 text-white" />
        </span>
      );
    }

    const iconName = option.leadingIcon ?? icon;

    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center text-white",
          isSelected ? "size-7 rounded-[7px] text-[8px] font-bold tracking-[0.02em]" : "size-5 rounded-[6px] text-[7px] font-bold tracking-[0.02em]",
          option.leadingColor ? null : isSelected ? "bg-[var(--accent)]" : "bg-surface-raised text-secondary",
          option.leadingClassName,
        )}
        style={option.leadingColor ? { background: option.leadingColor } : undefined}
      >
        {option.leadingLabel ? (
          option.leadingLabel
        ) : (
          <CupertinoIcon
            name={iconName}
            className={cn(isSelected ? "size-3.5" : "size-3", "text-white")}
          />
        )}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        render={
          <button
            type="button"
            className={cn(
              "mb-px flex h-[36px] items-center gap-[9px] rounded-[8px] border-0 bg-surface-raised px-2.5 text-left hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30 dark:hover:bg-surface-raised/80",
              minWidthClassName,
            )}
          />
        }
      >
        {renderLeading(selectedOption, false)}
        <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-primary">
          {selectedOption?.label ?? ""}
        </span>
        <CupertinoIcon name="chevronDown" className="size-3.5 text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-[10px] border border-subtle bg-surface p-1 shadow-[0_12px_28px_rgba(0,0,0,0.12)] ring-0 dark:bg-surface-muted dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
      >
        <div className="space-y-1">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left outline-none",
                  "text-primary focus:bg-surface-raised focus:text-primary",
                  isSelected ? "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : null,
                )}
              >
                {renderLeading(option, true)}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs font-medium",
                    isSelected ? "text-accent" : "text-primary",
                  )}
                >
                  {option.label}
                </span>
                <span className="ml-auto flex items-center gap-2">
                  {option.badgeLabel ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium ring-1",
                        option.badgeTone === "success"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/12 dark:text-emerald-300 dark:ring-emerald-400/25"
                          : "bg-surface-muted text-secondary ring-[var(--border-subtle)]",
                      )}
                    >
                      {option.badgeLabel}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <CupertinoIcon name="check" className="size-3.5 text-accent" />
                  ) : null}
                </span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
