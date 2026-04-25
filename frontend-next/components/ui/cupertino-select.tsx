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
        <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#007aff]">
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
          option.leadingColor ? null : isSelected ? "bg-[#007aff]" : "bg-[#8e8e93]",
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
              "mb-px flex h-[36px] items-center gap-[9px] rounded-[8px] border-0 bg-[#f2f2f4] dark:bg-[#2c2c2e] px-2.5 text-left hover:bg-black/6 dark:hover:bg-white/8",
              minWidthClassName,
            )}
          />
        }
      >
        {renderLeading(selectedOption, false)}
        <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-[#1c1c1e] dark:text-[#f2f2f7]">
          {selectedOption?.label ?? ""}
        </span>
        <CupertinoIcon name="chevronDown" className="size-3.5 text-[#8e8e93]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-[10px] border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#2c2c2e] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)] ring-0"
      >
        <div className="space-y-1">
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left text-[#1c1c1e] dark:text-[#f2f2f7] outline-none focus:text-[#1c1c1e] dark:focus:text-[#f2f2f7]",
                  isSelected ? "bg-[#007aff]/10" : "focus:bg-black/3 dark:focus:bg-white/8",
                )}
              >
                {renderLeading(option, true)}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-xs font-medium",
                    isSelected ? "text-[#007aff]" : "text-[#1c1c1e] dark:text-[#f2f2f7]",
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
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-slate-200",
                      )}
                    >
                      {option.badgeLabel}
                    </span>
                  ) : null}
                  {isSelected ? (
                    <CupertinoIcon name="check" className="size-3.5 text-[#007aff]" />
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
