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
}: CupertinoTableProps) {
  return (
    <div className="overflow-x-auto">
      <div className={cn(minWidthClassName)}>
        <div
          className={cn(
            "grid gap-3 border-b border-black/[0.04] dark:border-white/[0.07] px-[18px] py-2",
            columnsClassName,
            headerClassName,
          )}
        >
          {headers.map((header) => (
            <span
              key={header.key}
              className={cn(
                "text-left text-[10px] font-semibold tracking-[0.04em] text-[#8e8e93] uppercase",
                header.className,
              )}
            >
              {header.label}
            </span>
          ))}
        </div>

        <div className={cn("divide-y divide-black/[0.04] dark:divide-white/[0.07]", bodyClassName)}>
          {!hasRows && emptyState ? emptyState : null}
          {hasRows ? children : null}
        </div>
      </div>
    </div>
  );
}
