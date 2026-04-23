"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  CupertinoIcon,
  type CupertinoIconName,
} from "@/components/icons/cupertino-icon";
import {
  AddWalletDialog,
  WalletList,
} from "@/features/dashboard/dashboard-wallets";

type NavigationItem = {
  title: string;
  href: string;
  icon: CupertinoIconName;
};

const navigationGroups: { group: string; items: NavigationItem[] }[] = [
  {
    group: "Core",
    items: [
      { title: "Overview", href: "/", icon: "home" },
      { title: "Dashboard", href: "/dashboard", icon: "layout" },
      { title: "Transactions", href: "/transactions", icon: "database" },
    ],
  },
  {
    group: "Planning",
    items: [
      { title: "Planning", href: "/budgeting", icon: "receipt" },
      { title: "Budgeting", href: "/budgeting", icon: "piggy" },
      { title: "Recurring", href: "/recurring", icon: "repeat" },
    ],
  },
  {
    group: "Insights",
    items: [
      { title: "Reports", href: "/reports", icon: "barChart" },
      { title: "Analysis", href: "/analytics", icon: "pie" },
      { title: "Anomalies", href: "/anomalies", icon: "alert" },
    ],
  },
  {
    group: "Management",
    items: [
      { title: "Categories", href: "/categories", icon: "tag" },
      { title: "Merchants", href: "/merchants", icon: "store" },
      { title: "Rules", href: "/rules", icon: "list" },
      { title: "Review Queue", href: "/file/review", icon: "alert" },
    ],
  },
  {
    group: "System",
    items: [
      { title: "Data Sources", href: "/file", icon: "folder" },
      { title: "Imports", href: "/file", icon: "upload" },
      { title: "Backup & Restore", href: "/file/backup", icon: "download" },
    ],
  },
  {
    group: "More",
    items: [
      { title: "Settings", href: "/settings", icon: "settings" },
      { title: "Community", href: "/guide", icon: "users" },
      { title: "Get Support", href: "/guide", icon: "help" },
    ],
  },
];

function SidebarLinks({
  items,
  pathname,
}: {
  items: NavigationItem[];
  pathname: string;
}) {
  return (
    <div>
      {items.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href ||
              (item.href !== "/file" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.title}
            href={item.href}
            className={`mb-px flex h-[29px] w-full items-center gap-[9px] rounded-[8px] px-2.5 text-left text-[13px] font-normal text-[#1c1c1e] transition-colors ${
              isActive ? "bg-black/[0.07]" : "hover:bg-black/[0.03]"
            }`}
          >
            <CupertinoIcon
              name={item.icon}
              className={`size-3.5 ${
                isActive ? "text-[#1c1c1e]" : "text-black/40"
              }`}
              strokeWidth={1.75}
            />
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-0.5 px-4">
      <div className="pt-2 pb-[3px] text-[10px] font-semibold tracking-[0.07em] text-[#aeaeb2] uppercase">
        {label}
      </div>
      {children}
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);

  return (
    <Sidebar
      collapsible="none"
      className="fixed inset-y-0 left-0 z-30 h-svh w-[232px] min-w-[232px] overflow-hidden border-r border-black/[0.06] bg-white text-[#1c1c1e]"
    >
      <SidebarHeader className="h-[58px] shrink-0 border-b border-black/[0.06] px-5 py-0">
        <div className="flex h-full items-center gap-[9px]">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-[9px]"
          >
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[#1c1c1e] text-[11px] font-semibold text-white">
              M
            </span>
            <p className="truncate text-sm font-semibold tracking-[-0.2px] text-[#1c1c1e]">
              MBG
            </p>
          </Link>
          <span className="ml-auto rounded bg-[#007aff] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-white">
            PRO
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="gap-0 overflow-y-auto overflow-x-hidden">
        <div className="px-4 pt-4 pb-2.5">
          <WalletList
            onAddWallet={() => setIsWalletDialogOpen(true)}
            iconEnd={
              <CupertinoIcon
                name="chevronDown"
                className="size-3.5 text-[#aeaeb2]"
              />
            }
          />
        </div>

        <div className="my-1 h-px bg-black/[0.06]" />

        <nav className="flex-1 py-1">
          {navigationGroups.map((group) => (
            <SidebarSection key={group.group} label={group.group}>
              <SidebarLinks items={group.items} pathname={pathname} />
            </SidebarSection>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-black/[0.06] px-3.5 py-3.5">
        <div className="flex items-center gap-2 rounded-[9px] px-2.5 py-2">
          <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[linear-gradient(135deg,#ffd60a,#ff9f0a)] text-[11px] font-bold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-[#1c1c1e]">
              Alex Rahmad
            </div>
            <div className="truncate text-[10px] text-[#aeaeb2]">
              Synced 4 min ago
            </div>
          </div>
        </div>
      </SidebarFooter>

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
      />
    </Sidebar>
  );
}
