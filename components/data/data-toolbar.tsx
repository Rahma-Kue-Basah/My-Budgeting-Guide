"use client";

import { Download, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DataToolbar({
  search,
  onSearchChange,
  type,
  onTypeChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  type: "all" | "credit" | "debit";
  onTypeChange: (value: "all" | "credit" | "debit") => void;
}) {
  return (
    <section className="rounded-[20px] border border-border bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari deskripsi transaksi"
              className="h-11 rounded-lg border-border bg-white pl-11"
            />
          </div>
          <select
            value={type}
            onChange={(event) =>
              onTypeChange(event.target.value as "all" | "credit" | "debit")
            }
            className="h-11 rounded-lg border border-border bg-white px-4 text-sm text-slate-700 outline-none focus:border-primary"
          >
            <option value="all">Semua tipe</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="h-11 rounded-lg border-border bg-white"
          >
            <Filter className="size-4" />
            Filter
          </Button>
          <Button className="h-11 rounded-lg px-5 text-white">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </section>
  );
}
