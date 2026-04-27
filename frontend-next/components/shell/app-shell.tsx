import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-transparent md:pl-[232px]">
        <div className="flex flex-1 flex-col">
          <div className="sticky top-0 z-20 h-[58px] border-b border-subtle bg-background/80 px-4 backdrop-blur md:hidden">
            <div className="flex h-full items-center gap-3">
              <SidebarTrigger className="size-9 rounded-full border border-subtle bg-surface/80 dark:border-subtle dark:bg-surface/80" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  Nidhi.id
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Personal Finance
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
