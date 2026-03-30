"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  CircleHelp,
  Database,
  Download,
  FileWarning,
  FolderOpen,
  LayoutGrid,
  ListFilter,
  PieChart,
  PiggyBank,
  Repeat2,
  Store,
  Tags,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  iconWrapClassName: string;
};

const overviewNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutGrid,
    iconClassName: "text-indigo-500",
    iconWrapClassName: "bg-indigo-50 ring-indigo-100",
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: Database,
    iconClassName: "text-sky-500",
    iconWrapClassName: "bg-sky-50 ring-sky-100",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    iconClassName: "text-violet-500",
    iconWrapClassName: "bg-violet-50 ring-violet-100",
  },
];

const fileNavigation: NavigationItem[] = [
  {
    title: "File",
    href: "/file",
    icon: FolderOpen,
    iconClassName: "text-amber-500",
    iconWrapClassName: "bg-amber-50 ring-amber-100",
  },
  {
    title: "Review Queue",
    href: "/file/review",
    icon: FileWarning,
    iconClassName: "text-rose-500",
    iconWrapClassName: "bg-rose-50 ring-rose-100",
  },
  {
    title: "Backup & Restore",
    href: "/file/backup",
    icon: Download,
    iconClassName: "text-cyan-500",
    iconWrapClassName: "bg-cyan-50 ring-cyan-100",
  },
];

const planningNavigation: NavigationItem[] = [
  {
    title: "Budgeting",
    href: "/budgeting",
    icon: PiggyBank,
    iconClassName: "text-emerald-500",
    iconWrapClassName: "bg-emerald-50 ring-emerald-100",
  },
];

const classificationNavigation: NavigationItem[] = [
  {
    title: "Rules",
    href: "/rules",
    icon: ListFilter,
    iconClassName: "text-cyan-500",
    iconWrapClassName: "bg-cyan-50 ring-cyan-100",
  },
  {
    title: "Merchants",
    href: "/merchants",
    icon: Store,
    iconClassName: "text-emerald-500",
    iconWrapClassName: "bg-emerald-50 ring-emerald-100",
  },
  {
    title: "Category Review",
    href: "/categories",
    icon: Tags,
    iconClassName: "text-pink-500",
    iconWrapClassName: "bg-pink-50 ring-pink-100",
  },
  {
    title: "Category Insights",
    href: "/analytics",
    icon: PieChart,
    iconClassName: "text-violet-500",
    iconWrapClassName: "bg-violet-50 ring-violet-100",
  },
];

const analysisNavigation: NavigationItem[] = [
  {
    title: "Recurring",
    href: "/recurring",
    icon: Repeat2,
    iconClassName: "text-sky-500",
    iconWrapClassName: "bg-sky-50 ring-sky-100",
  },
  {
    title: "Anomalies",
    href: "/anomalies",
    icon: AlertTriangle,
    iconClassName: "text-rose-500",
    iconWrapClassName: "bg-rose-50 ring-rose-100",
  },
];

const footerNavigation: NavigationItem[] = [
  {
    title: "Guide",
    href: "/guide",
    icon: CircleHelp,
    iconClassName: "text-stone-500",
    iconWrapClassName: "bg-stone-50 ring-stone-100",
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
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              render={<Link href={item.href} />}
              isActive={pathname === item.href}
              tooltip={item.title}
              className="rounded-xl border border-transparent text-slate-600 hover:border-white/70 hover:bg-white/75 hover:text-slate-900 data-[active=true]:border-white/80 data-[active=true]:bg-white data-[active=true]:text-slate-950 data-[active=true]:shadow-[0_8px_20px_rgba(122,139,184,0.12)] dark:hover:border-indigo-900/70 dark:hover:bg-indigo-950/40 dark:data-[active=true]:border-indigo-900/70 dark:data-[active=true]:bg-indigo-950/40"
            >
              <span
                className={`flex size-7 items-center justify-center rounded-xl ring-1 ring-inset ${item.iconWrapClassName}`}
              >
                <Icon className={`size-3.5 ${item.iconClassName}`} />
              </span>
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      variant="inset"
      collapsible="icon"
      className="text-sidebar-foreground"
    >
      <SidebarHeader className="gap-3 px-2 pt-2">
        <div className="flex items-center justify-between px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-medium text-foreground">
              MBG (My Budgeting Guide)
            </p>
          </div>
          <SidebarTrigger className="size-9 rounded-full border border-white/70 bg-white/70" />
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-3 bg-white/70" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarLinks items={overviewNavigation} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Planning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarLinks items={planningNavigation} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Analysis</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarLinks items={analysisNavigation} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Category</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarLinks
              items={classificationNavigation}
              pathname={pathname}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">Data Source</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarLinks items={fileNavigation} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>

      <SidebarSeparator className="mx-3 bg-white/70" />

      <SidebarFooter>
        <SidebarLinks items={footerNavigation} pathname={pathname} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
