"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Database,
  Download,
  FileStack,
  FolderOpenDot,
  LayoutDashboard,
  Settings,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "File",
    items: [
      { label: "Upload", href: "/file/upload", icon: UploadCloud },
      { label: "List File", href: "/file/list", icon: FolderOpenDot },
    ],
  },
  { label: "Data", href: "/data", icon: Database },
  { label: "Export", href: "/export", icon: Download },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-border bg-sidebar lg:flex lg:flex-col">
      <div className="border-b border-border px-6 py-7">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
            <FileStack className="size-5" />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-900">
              MBG
            </p>
            <p className="text-sm text-slate-500">
              My Budget Guide
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {navigation.map((item) => {
            if ("items" in item) {
              return (
                <div key={item.label} className="space-y-2">
                  <p className="px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
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
                          "group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900",
                          isActive &&
                            "bg-accent text-slate-900"
                        )}
                      >
                        <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 transition-colors group-hover:text-primary">
                          <Icon className="size-4" />
                        </span>
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
                  "group flex items-center gap-3 rounded-lg px-3.5 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900",
                  isActive &&
                    "bg-accent text-slate-900"
                )}
              >
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-slate-500 transition-colors group-hover:text-primary">
                  <Icon className="size-4" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
