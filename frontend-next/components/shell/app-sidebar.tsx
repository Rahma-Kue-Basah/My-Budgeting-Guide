"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/contexts/auth-context";

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
} from "@/features/wallets/wallets";

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
      { title: "Wallet", href: "/wallets", icon: "wallet" },
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
            className={`mb-px flex h-[29px] w-full items-center gap-[9px] rounded-[8px] px-2.5 text-left text-[13px] transition-colors ${
              isActive
                ? "bg-(--accent)/8 font-medium text-accent dark:bg-(--accent)/10 dark:text-accent"
                : "font-normal text-primary hover:bg-black/4 dark:hover:bg-white/6"
            }`}
          >
            <CupertinoIcon
              name={item.icon}
              className={`size-3.5 ${
                isActive ? "text-accent" : "text-tertiary"
              }`}
              strokeWidth={isActive ? 2 : 1.75}
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

const profileColorClass: Record<string, string> = {
  accent: "bg-[var(--accent)]",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  graphite: "bg-[var(--text-primary)]",
};

export function AppSidebar() {
  const pathname = usePathname();
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const { user, logout } = useAuth();

  const avatarColor =
    profileColorClass[user?.profile?.profile_color ?? ""] ?? "bg-warning";
  const initials = user?.profile?.initials ?? "?";
  const displayName = user?.profile?.full_name ?? user?.email ?? "";

  return (
    <Sidebar
      collapsible="offcanvas"
      className="liquid-sidebar overflow-hidden text-primary border-r border-black/6 dark:border-white/6"
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
              Nidhi.id
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
        <div className="flex items-center gap-2 rounded-[14px] border border-subtle bg-surface px-2.5 py-2">
          <div
            className={`flex size-6.5 shrink-0 items-center justify-center rounded-[7px] ${avatarColor} text-[11px] font-bold text-white`}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-primary">
              {displayName}
            </div>
            <div className="truncate text-[10px] text-tertiary dark:text-secondary">
              {user?.email ?? ""}
            </div>
          </div>
          <button
            onClick={logout}
            className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-[6px] text-tertiary transition-colors hover:bg-surface-muted hover:text-primary"
            title="Sign out"
          >
            <CupertinoIcon name="logout" className="size-3.5" />
          </button>
        </div>
      </SidebarFooter>

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
      />
    </Sidebar>
  );
}
