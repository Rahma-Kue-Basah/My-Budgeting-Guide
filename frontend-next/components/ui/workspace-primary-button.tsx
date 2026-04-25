import type { ButtonHTMLAttributes, ReactNode } from "react";

import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { cn } from "@/lib/utils";

type WorkspacePrimaryButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    size?: "default" | "sm";
  };

export function WorkspacePrimaryButton({
  className,
  children,
  size = "default",
  ...props
}: WorkspacePrimaryButtonProps) {
  return (
    <CupertinoActionButton
      className={cn(
        size === "sm"
          ? "h-8 rounded-[8px] px-3 text-xs"
          : "h-9 rounded-[9px] px-3 text-sm",
        className,
      )}
      {...props}
    >
      {children}
    </CupertinoActionButton>
  );
}
