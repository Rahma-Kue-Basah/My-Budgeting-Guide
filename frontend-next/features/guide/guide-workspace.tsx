"use client";

import Link from "next/link";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";

type GuideStep = {
  number: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: "upload" | "receipt" | "tag" | "store" | "list" | "piggy" | "layout" | "repeat";
  iconBg: string;
  iconColor: string;
};

const mainSteps: GuideStep[] = [
  {
    number: "1",
    title: "Upload File",
    description:
      "Mulai dari halaman File untuk mengunggah PDF mutasi rekening. Pilih bank, upload file, lalu biarkan parser membaca transaksi ke workspace lokal.",
    href: "/file",
    cta: "Open file workspace",
    icon: "upload",
    iconBg: "bg-[var(--accent)]",
    iconColor: "text-white",
  },
  {
    number: "2",
    title: "Review File",
    description:
      "Tetap di halaman File untuk memeriksa hasil parsing. Di sana user bisa lihat raw text, edit transaksi yang keliru, hapus row yang tidak valid, lalu tandai file sebagai processed.",
    href: "/file",
    cta: "Open file review",
    icon: "receipt",
    iconBg: "bg-warning",
    iconColor: "text-white",
  },
  {
    number: "3",
    title: "Lihat Category, Tambah dan Edit Jika Perlu",
    description:
      "Kalau struktur kategori belum pas, buka Rules untuk menambah kategori baru, mengedit keyword, dan merapikan prioritas rule default.",
    href: "/rules",
    cta: "Open rules",
    icon: "tag",
    iconBg: "bg-[var(--accent)]",
    iconColor: "text-white",
  },
  {
    number: "4",
    title: "Opsional: Rapikan Edge Case Merchant",
    description:
      "Kalau masih ada merchant atau alias payee yang sulit dibaca konsisten, buka Advanced Tools untuk merapikan nama merchant dan menggabungkan aliasnya.",
    href: "/merchants",
    cta: "Open advanced tools",
    icon: "store",
    iconBg: "bg-success",
    iconColor: "text-white",
  },
  {
    number: "5",
    title: "Review Categories",
    description:
      "Gunakan Category Review untuk mengecek hasil klasifikasi akhir, terutama transaksi yang masih uncategorized atau masih hanya cocok lewat keyword umum.",
    href: "/categories",
    cta: "Open category review",
    icon: "list",
    iconBg: "bg-danger",
    iconColor: "text-white",
  },
  {
    number: "6",
    title: "Buat Budget Plan Bulanan",
    description:
      "Masuk ke Budgeting untuk membuat plan income, expense, savings, dan alokasi per kategori berdasarkan histori transaksi processed yang sudah rapi.",
    href: "/budgeting",
    cta: "Open budgeting",
    icon: "piggy",
    iconBg: "bg-success",
    iconColor: "text-white",
  },
];

const followUpLinks = [
  {
    title: "Category Insights",
    description: "Lihat performa kategori, merchant dominan, dan kontribusi income/expense per kategori.",
    href: "/analytics",
    cta: "Open category insights",
    icon: "pie" as const,
  },
  {
    title: "Recurring",
    description: "Deteksi transaksi berulang seperti tagihan, subscription, atau pemasukan rutin.",
    href: "/recurring",
    cta: "Open recurring",
    icon: "repeat" as const,
  },
  {
    title: "Reports",
    description: "Lihat ringkasan bulanan, distribusi income/expense, dan report siap review.",
    href: "/reports",
    cta: "Open reports",
    icon: "barChart" as const,
  },
];


export function GuideWorkspace() {
  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar title="Cara Pakai Nidhi.id" />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="rounded-[13px] bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <p className="text-[11px] leading-5 text-tertiary">
            Nidhi.id paling enak dipakai sebagai workflow bertahap — rapikan data dulu, baru masuk ke klasifikasi, lalu analisis. Ikuti urutan ini untuk hasil terbaik.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mainSteps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col rounded-[13px] bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <CupertinoChip tone="neutral">Step {step.number}</CupertinoChip>
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${step.iconBg}`}
                >
                  <CupertinoIcon name={step.icon} className={`size-4 ${step.iconColor}`} />
                </span>
              </div>

              <p className="mt-3 text-[13px] font-semibold text-primary">
                {step.title}
              </p>
              <p className="mt-1.5 flex-1 text-[11px] leading-5 text-tertiary">
                {step.description}
              </p>

              <Link
                href={step.href}
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-subtle bg-surface-muted px-3 text-[11px] font-medium text-primary transition-colors hover:bg-surface-raised self-start"
              >
                {step.cta}
                <CupertinoIcon name="chevronDown" className="size-3 -rotate-90 text-tertiary" />
              </Link>
            </div>
          ))}
        </section>

        <section className="rounded-[13px] bg-surface p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <h2 className="mb-1 text-[13px] font-semibold text-primary">Setelah Step 6</h2>
          <p className="mb-4 text-[11px] leading-5 text-tertiary">
            Gunakan halaman-halaman ini setelah data dan budget plan sudah rapi untuk mendapatkan insight lebih dalam.
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            {followUpLinks.map((item) => (
              <div key={item.title} className="rounded-[12px] bg-surface-muted p-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface dark:bg-surface-muted shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <CupertinoIcon name={item.icon} className="size-3.5 text-secondary" />
                  </span>
                  <p className="text-[13px] font-semibold text-primary">{item.title}</p>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-tertiary">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-subtle bg-surface dark:bg-surface-muted px-3 text-[11px] font-medium text-primary transition-colors hover:bg-surface-muted dark:hover:bg-surface-raised"
                >
                  {item.cta}
                  <CupertinoIcon name="chevronDown" className="size-3 -rotate-90 text-tertiary" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
