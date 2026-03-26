"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AppHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="flex flex-col gap-6 px-5 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {actions}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Cari file, transaksi, atau batch upload"
              className="h-11 rounded-xl border-border bg-white pl-11"
            />
          </div>
          <div className="hidden lg:block text-sm text-slate-500">
            Review batch, cek data, lalu export hasil.
          </div>
        </div>
      </div>
    </header>
  );
}
