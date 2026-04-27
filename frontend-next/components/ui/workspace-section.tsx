import type { ComponentPropsWithoutRef, ElementType } from "react";

import { cn } from "@/lib/utils";

type WorkspaceSectionProps<T extends ElementType = "section"> = {
  as?: T;
  padded?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

export function WorkspaceSection<T extends ElementType = "section">({
  as,
  padded = true,
  className,
  ...props
}: WorkspaceSectionProps<T>) {
  const Component = as ?? "section";

  return (
    <Component
      className={cn(
        "rounded-[13px] border-0 bg-surface shadow-[0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-none",
        padded && "p-[18px]",
        className,
      )}
      {...props}
    />
  );
}
