import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceTopBarProps = {
  title: ReactNode;
  actions?: ReactNode;
  variant?: "sticky" | "fixed";
  className?: string;
  contentClassName?: string;
};

export function WorkspaceTopBar({
  title,
  actions,
  variant = "sticky",
  className,
  contentClassName,
}: WorkspaceTopBarProps) {
  return (
    <section
      className={cn(
        variant === "fixed"
          ? "fixed top-[58px] right-0 left-0 z-20 border-b border-subtle bg-surface md:top-0 md:left-[232px] md:w-[calc(100%-232px)]"
          : "sticky top-[58px] z-10 border-b border-subtle bg-surface md:top-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5",
          variant === "fixed" && "h-[58px] py-0",
          contentClassName,
        )}
      >
        <div className="min-w-0">
          {typeof title === "string" ? (
            <h1 className="truncate text-xl font-semibold tracking-normal text-primary">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>
        {actions ? (
          <div className="ml-auto hidden flex-wrap items-center gap-2 sm:flex">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
