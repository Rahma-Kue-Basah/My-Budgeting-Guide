import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const CUPERTINO_TABLE_ROW_HEIGHT_CLASS = "min-h-[52px] py-2.5";

type CupertinoTableHeader = {
  key: string;
  label: ReactNode;
  className?: string;
};

type CupertinoTableProps = {
  headers: CupertinoTableHeader[];
  columnsClassName: string;
  children?: ReactNode;
  emptyState?: ReactNode;
  hasRows?: boolean;
  minWidthClassName?: string;
  bodyClassName?: string;
  headerClassName?: string;
  rowTextClassName?: string;
};

export function CupertinoTable({
  headers,
  columnsClassName,
  children,
  emptyState,
  hasRows = true,
  minWidthClassName = "min-w-[760px]",
  bodyClassName,
  headerClassName,
  rowTextClassName,
}: CupertinoTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className={cn(minWidthClassName)}>
        <div
          className={cn(
            "grid gap-3 border-b border-subtle px-[18px] py-2",
            columnsClassName,
            headerClassName,
          )}
        >
          {headers.map((header) => (
            <span
              key={header.key}
              className={cn(
                "text-left text-[10px] font-semibold tracking-[0.04em] text-tertiary uppercase",
                header.className,
              )}
            >
              {header.label}
            </span>
          ))}
        </div>

        <div className={cn("divide-y divide-[var(--border-subtle)] text-primary", rowTextClassName, bodyClassName)}>
          {!hasRows && emptyState ? (
            <div className="text-secondary">{emptyState}</div>
          ) : null}
          {hasRows ? children : null}
        </div>
      </div>
    </div>
  );
}
