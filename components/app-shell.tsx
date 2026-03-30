import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
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
      <SidebarInset className="min-h-svh bg-transparent">
        <div className="flex flex-1 flex-col">
          <div className="sticky top-0 z-20 border-b border-white/70 bg-background/80 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="size-9 rounded-full border border-white/70 bg-white/80" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  MBG
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  My Budgeting Guide
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1">{children}</div>
          <footer className="px-4 pt-8 pb-3 text-xs text-muted-foreground md:px-6">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-center">
              <p>MBG (My Budgeting Guide)</p>
              <p> 2026 @ Aziz Rahmad </p>
            </div>
          </footer>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
