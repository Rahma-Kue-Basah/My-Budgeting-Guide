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
        "rounded-[20px] border border-subtle bg-surface shadow-[0_10px_30px_rgba(15,23,42,0.03)] dark:shadow-none",
        padded && "p-[18px]",
        className,
      )}
      {...props}
    />
  );
}
