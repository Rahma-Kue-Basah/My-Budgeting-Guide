import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen style={{ "--sidebar-width": "232px" } as CSSProperties}>
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-transparent">
        <div className="flex flex-1 flex-col">
          <div className="flex-1">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
