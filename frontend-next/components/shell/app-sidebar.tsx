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
      { title: "Rules", href: "/rules", icon: "list" },
    ],
  },
  {
    group: "System",
    items: [
      { title: "Imports", href: "/file", icon: "upload" },
      { title: "Advanced Tools", href: "/merchants", icon: "store" },
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
            className={`mb-px flex h-[29px] w-full items-center gap-[9px] rounded-[8px] px-2.5 text-left text-[13px] font-normal text-primary transition-colors ${
              isActive
                ? "bg-white backdrop-blur-xl dark:bg-white/6 dark:backdrop-blur-xl"
                : "bg-transparent shadow-none hover:bg-surface/24 dark:hover:bg-white/6"
            }`}
          >
            <CupertinoIcon
              name={item.icon}
              className={`size-3.5 ${
                isActive ? "text-primary" : "text-tertiary"
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
      <div className="pl-2.5 pt-2 pb-0.75 text-[10px] font-semibold tracking-[0.07em] text-[var(--text-tertiary)] dark:text-[var(--text-secondary)] uppercase">
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
      className="liquid-sidebar fixed inset-y-0 left-0 z-30 h-svh w-[232px] min-w-[232px] overflow-hidden text-primary border-r border-secondary"
    >
      <SidebarHeader className="h-[58px] shrink-0 bg-surface/42 px-5 py-0 backdrop-blur-xl">
        <div className="flex h-full items-center gap-[9px]">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-[9px]"
          >
            <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[var(--text-primary)] dark:bg-surface-raised text-[11px] font-semibold text-white">
              M
            </span>
            <p className="truncate text-sm font-semibold tracking-[-0.2px] text-primary">
              Expensave
            </p>
          </Link>
          <span className="ml-auto rounded bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.04em] text-white">
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
                className="size-3.5 text-tertiary dark:text-secondary"
              />
            }
          />
        </div>

        <nav className="flex-1 py-1">
          {navigationGroups.map((group) => (
            <SidebarSection key={group.group} label={group.group}>
              <SidebarLinks items={group.items} pathname={pathname} />
            </SidebarSection>
          ))}
        </nav>
      </SidebarContent>

      <SidebarFooter className="bg-surface/34 px-3.5 py-3.5 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-[9px] bg-surface/36 px-2.5 py-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]">
          <div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-warning text-[11px] font-bold text-white">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-primary">
              Alex Rahmad
            </div>
            <div className="truncate text-[10px] text-tertiary dark:text-secondary">
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
