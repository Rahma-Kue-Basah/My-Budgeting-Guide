"use client";

import Link from "next/link";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { CupertinoChip } from "@/components/ui/cupertino-chip";

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
    iconBg: "bg-[#0a84ff]",
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
    iconBg: "bg-[#ff9f0a]",
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
    iconBg: "bg-[#5ac8fa]",
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
    iconBg: "bg-[#30d158]",
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
    iconBg: "bg-[#ff375f]",
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
    iconBg: "bg-[#34c759]",
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
    <main className="min-h-svh flex-1 bg-[#f2f2f4] dark:bg-black text-[#1c1c1e] dark:text-[#f2f2f7]">
      <section className="sticky top-[58px] z-10 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#f2f2f7]">
            Cara Pakai MBG
          </h1>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <p className="text-[11px] leading-5 text-[#8e8e93]">
            MBG paling enak dipakai sebagai workflow bertahap — rapikan data dulu, baru masuk ke klasifikasi, lalu analisis. Ikuti urutan ini untuk hasil terbaik.
          </p>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {mainSteps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none"
            >
              <div className="flex items-start justify-between gap-3">
                <CupertinoChip tone="neutral">Step {step.number}</CupertinoChip>
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${step.iconBg}`}
                >
                  <CupertinoIcon name={step.icon} className={`size-4 ${step.iconColor}`} />
                </span>
              </div>

              <p className="mt-3 text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">
                {step.title}
              </p>
              <p className="mt-1.5 flex-1 text-[11px] leading-5 text-[#8e8e93]">
                {step.description}
              </p>

              <Link
                href={step.href}
                className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-black/[0.08] bg-[#f7f7f8] px-3 text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7] transition-colors hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c] self-start"
              >
                {step.cta}
                <CupertinoIcon name="chevronDown" className="size-3 -rotate-90 text-[#8e8e93]" />
              </Link>
            </div>
          ))}
        </section>

        <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <h2 className="mb-1 text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Setelah Step 6</h2>
          <p className="mb-4 text-[11px] leading-5 text-[#8e8e93]">
            Gunakan halaman-halaman ini setelah data dan budget plan sudah rapi untuk mendapatkan insight lebih dalam.
          </p>
          <div className="grid gap-2 md:grid-cols-3">
            {followUpLinks.map((item) => (
              <div key={item.title} className="rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] p-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-[8px] bg-white dark:bg-[#2c2c2e] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
                    <CupertinoIcon name={item.icon} className="size-3.5 text-[#636366] dark:text-[#8e8e93]" />
                  </span>
                  <p className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">{item.title}</p>
                </div>
                <p className="mt-2 text-[11px] leading-5 text-[#8e8e93]">{item.description}</p>
                <Link
                  href={item.href}
                  className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#2c2c2e] px-3 text-[11px] font-medium text-[#1c1c1e] dark:text-[#f2f2f7] transition-colors hover:bg-[#f7f7f8] dark:hover:bg-[#3a3a3c]"
                >
                  {item.cta}
                  <CupertinoIcon name="chevronDown" className="size-3 -rotate-90 text-[#8e8e93]" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
