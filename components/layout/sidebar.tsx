"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Settings,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "File",
    items: [
      { label: "Upload", href: "/file/upload", icon: Upload },
      { label: "List File", href: "/file/list", icon: FolderOpen },
    ],
  },
  { label: "Data", href: "/data", icon: Database },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r border-sidebar-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.92))] lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border/80 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl border border-sidebar-border/80 bg-background shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <FileText className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">BCA Tracker</p>
            <p className="text-xs text-muted-foreground">Mutation workspace</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5">
        <div className="space-y-5">
          {navigation.map((item) => {
            if ("items" in item) {
              return (
                <div key={item.label} className="space-y-1">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {item.label}
                  </p>
                  {item.items.map((subItem) => {
                    const Icon = subItem.icon;
                    const isActive = pathname === subItem.href;

                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
                          isActive &&
                            "border-border/80 bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                        )}
                      >
                        <Icon className="size-4" />
                        <span>{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground",
                  isActive &&
                    "border-border/80 bg-background text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
