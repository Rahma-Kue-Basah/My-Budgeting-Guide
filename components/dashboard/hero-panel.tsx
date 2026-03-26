import Link from "next/link";
import { ArrowRight, Sparkles, UploadCloud } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HeroPanel() {
  return (
    <section className="rounded-[24px] border border-border bg-white p-7 shadow-[0_1px_2px_rgba(16,24,40,0.03)] sm:p-8">
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] text-primary">
            <Sparkles className="size-3.5" />
            Finance dashboard
          </span>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.5rem] sm:leading-[1.15]">
            Upload mutasi BCA, rapikan datanya, lalu pantau hasilnya dalam satu workspace yang ringan.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            Tampilan ini dirancang untuk alur kerja upload PDF, review transaksi,
            monitoring file, dan export data dengan nuansa dashboard produk modern.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/file/upload"
              className={cn(
                buttonVariants({}),
                "h-11 rounded-lg px-5"
              )}
            >
              <UploadCloud className="size-4" />
              Upload PDF
            </Link>
            <Link
              href="/data"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-lg px-5 text-slate-700"
              )}
            >
              Lihat data
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              Batch aktif
            </p>
            <p className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-950">04 file</p>
            <p className="mt-1 text-sm text-slate-500">Siap dirapikan dan diexport</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
              Workspace feel
            </p>
            <p className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-950">Polished</p>
            <p className="mt-1 text-sm text-slate-500">Creator x finance inspired</p>
          </div>
        </div>
      </div>
    </section>
  );
}
