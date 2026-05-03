"use client";

import Link from "next/link";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { CupertinoChip } from "@/components/ui/cupertino-chip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import { cn } from "@/lib/utils";

type GuideStep = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: "upload" | "receipt" | "tag" | "store" | "list" | "piggy" | "layout" | "repeat";
  iconBg: string;
  iconColor: string;
  chipTone: "neutral" | "sky" | "amber" | "indigo" | "emerald" | "rose";
};

const mainSteps: GuideStep[] = [
  {
    number: "1",
    eyebrow: "Import",
    title: "Upload File",
    description:
      "Mulai dari halaman File untuk mengunggah PDF mutasi rekening. Pilih bank, upload file, lalu biarkan parser membaca transaksi ke workspace lokal.",
    href: "/file",
    cta: "Open file workspace",
    icon: "upload",
    iconBg: "bg-[var(--accent)]",
    iconColor: "text-white",
    chipTone: "sky",
  },
  {
    number: "2",
    eyebrow: "Validate",
    title: "Review File",
    description:
      "Tetap di halaman File untuk memeriksa hasil parsing. Di sana user bisa lihat raw text, edit transaksi yang keliru, hapus row yang tidak valid, lalu tandai file sebagai processed.",
    href: "/file",
    cta: "Open file review",
    icon: "receipt",
    iconBg: "bg-warning",
    iconColor: "text-white",
    chipTone: "amber",
  },
  {
    number: "3",
    eyebrow: "Rules",
    title: "Lihat Category, Tambah dan Edit Jika Perlu",
    description:
      "Kalau struktur kategori belum pas, buka Rules untuk menambah kategori baru, mengedit keyword, dan merapikan prioritas rule default.",
    href: "/rules",
    cta: "Open rules",
    icon: "tag",
    iconBg: "bg-[var(--accent)]",
    iconColor: "text-white",
    chipTone: "indigo",
  },
  {
    number: "4",
    eyebrow: "Cleanup",
    title: "Opsional: Rapikan Edge Case Merchant",
    description:
      "Kalau masih ada merchant atau alias payee yang sulit dibaca konsisten, buka Advanced Tools untuk merapikan nama merchant dan menggabungkan aliasnya.",
    href: "/merchants",
    cta: "Open advanced tools",
    icon: "store",
    iconBg: "bg-success",
    iconColor: "text-white",
    chipTone: "emerald",
  },
  {
    number: "5",
    eyebrow: "Review",
    title: "Review Categories",
    description:
      "Gunakan Category Review untuk mengecek hasil klasifikasi akhir, terutama transaksi yang masih uncategorized atau masih hanya cocok lewat keyword umum.",
    href: "/categories",
    cta: "Open category review",
    icon: "list",
    iconBg: "bg-danger",
    iconColor: "text-white",
    chipTone: "rose",
  },
  {
    number: "6",
    eyebrow: "Plan",
    title: "Buat Budget Plan Bulanan",
    description:
      "Masuk ke Budgeting untuk membuat plan income, expense, savings, dan alokasi per kategori berdasarkan histori transaksi processed yang sudah rapi.",
    href: "/budgeting",
    cta: "Open budgeting",
    icon: "piggy",
    iconBg: "bg-success",
    iconColor: "text-white",
    chipTone: "emerald",
  },
];

export function GuideWorkspace() {
  return (
    <main className="min-h-svh flex-1 bg-app text-primary">
      <WorkspaceTopBar title="Cara Pakai Nidhi.id" />

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="space-y-2">
          <div className="px-1">
            <p className="text-[11px] font-medium tracking-[0.08em] text-tertiary uppercase">
              Core workflow
            </p>
            <h3 className="mt-1 text-[16px] font-semibold tracking-[-0.02em] text-primary">
              Enam langkah utama sebelum masuk ke insight
            </h3>
            <p className="mt-1 text-[11px] leading-5 text-tertiary">
              Step 1-6 ini adalah alur yang paling selaras dengan struktur fitur dan output analisis di app.
            </p>
          </div>

          <div className="relative pl-12 md:pl-16">
            <div className="absolute top-2 bottom-2 left-[18px] w-[3px] rounded-full bg-[linear-gradient(180deg,var(--accent),color-mix(in_srgb,var(--accent)_16%,var(--border-subtle)))] md:left-[26px]" />
            {mainSteps.map((step) => (
              <div
                key={step.number}
                className="relative mb-2.5 last:mb-0"
              >
                <div className="absolute top-5 left-[-48px] z-10 md:left-[-64px]">
                  <div
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-full border border-subtle bg-surface shadow-[0_10px_24px_rgba(15,23,42,0.08)] dark:shadow-[0_14px_28px_rgba(0,0,0,0.24)] md:size-[52px]",
                      step.iconBg,
                    )}
                  >
                    <CupertinoIcon
                      name={step.icon}
                      className={cn("size-3.5 md:size-4", step.iconColor)}
                    />
                    <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border border-subtle bg-surface text-[9px] font-semibold text-primary shadow-[0_6px_14px_rgba(15,23,42,0.08)] md:size-5 md:text-[10px] dark:shadow-[0_10px_18px_rgba(0,0,0,0.24)]">
                      {step.number}
                    </span>
                  </div>
                </div>

                <div className="absolute top-9 left-[-12px] h-px w-3 bg-[color-mix(in_srgb,var(--accent)_28%,var(--border-subtle))] md:left-[-12px] md:w-4" />

                <Card
                  className={cn(
                    "gap-0 rounded-[18px] py-0 transition-all",
                    "hover:border-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.035)]",
                    Number(step.number) % 2 === 0
                      ? "md:bg-[color-mix(in_srgb,var(--bg-surface)_84%,var(--warning)_16%)]"
                      : "md:bg-[color-mix(in_srgb,var(--bg-surface)_86%,var(--accent)_14%)]",
                  )}
                >
                  <CardHeader className="gap-2 p-3.5 pb-0">
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <CupertinoChip tone={step.chipTone}>{step.eyebrow}</CupertinoChip>
                      </div>
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${step.iconBg}`}
                      >
                        <CupertinoIcon name={step.icon} className={`size-3.5 ${step.iconColor}`} />
                      </span>
                    </div>

                    <CardTitle className="text-[14px] font-semibold tracking-[-0.02em] text-primary md:text-[16px]">
                      {step.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex-1 p-3.5 pt-0.5">
                    <CardDescription className="text-[11px] leading-[1.55] text-tertiary md:text-[12px] md:leading-[1.6]">
                      {step.description}
                    </CardDescription>
                  </CardContent>

                  <CardFooter className="border-t border-subtle p-3.5 pt-2">
                    <Link
                      href={step.href}
                      className="inline-flex h-7.5 items-center gap-1.5 rounded-[9px] bg-surface-muted px-2.5 text-[10px] font-medium text-primary transition-colors hover:bg-surface-raised"
                    >
                      {step.cta}
                      <CupertinoIcon name="chevronDown" className="size-3 -rotate-90 text-tertiary" />
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
