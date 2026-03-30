"use client";

import Link from "next/link";
import {
  ArrowRight,
  CircleHelp,
  FileCheck2,
  FileUp,
  FolderKanban,
  LayoutList,
  PiggyBank,
  Repeat2,
  Store,
  Tags,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type GuideStep = {
  number: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: typeof FileUp;
  className: string;
  iconClassName: string;
};

const mainSteps: GuideStep[] = [
  {
    number: "1",
    title: "Upload File",
    description:
      "Mulai dari halaman File untuk mengunggah PDF mutasi rekening. Pilih bank, upload file, lalu biarkan parser membaca transaksi ke workspace lokal.",
    href: "/file",
    cta: "Open file workspace",
    icon: FileUp,
    className: "border-sky-200/80 bg-sky-400/35",
    iconClassName: "bg-sky-100 text-sky-500 ring-sky-200/80",
  },
  {
    number: "2",
    title: "Review File",
    description:
      "Buka Review Queue untuk memeriksa hasil parsing. Di sini user bisa lihat raw text, edit transaksi yang keliru, hapus row yang tidak valid, lalu tandai file sebagai processed.",
    href: "/file/review",
    cta: "Open review queue",
    icon: FileCheck2,
    className: "border-amber-200/80 bg-amber-400/35",
    iconClassName: "bg-amber-100 text-amber-500 ring-amber-200/80",
  },
  {
    number: "3",
    title: "Lihat Category, Tambah dan Edit Jika Perlu",
    description:
      "Kalau struktur kategori belum pas, buka Rules untuk menambah kategori baru, mengedit keyword, dan merapikan prioritas rule default.",
    href: "/rules",
    cta: "Open rules",
    icon: Tags,
    className: "border-cyan-200/80 bg-cyan-400/35",
    iconClassName: "bg-cyan-100 text-cyan-500 ring-cyan-200/80",
  },
  {
    number: "4",
    title: "Kelompokkan Category Berdasarkan Merchant",
    description:
      "Setelah kategori siap, buka Merchants untuk memetakan merchant ke kategori yang paling tepat. Ini lebih stabil daripada hanya mengandalkan keyword deskripsi.",
    href: "/merchants",
    cta: "Open merchants",
    icon: Store,
    className: "border-emerald-200/80 bg-emerald-400/35",
    iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
  },
  {
    number: "5",
    title: "Review Categories",
    description:
      "Gunakan Category Review untuk mengecek hasil klasifikasi akhir, terutama transaksi yang masih uncategorized atau masih hanya cocok lewat keyword umum.",
    href: "/categories",
    cta: "Open category review",
    icon: LayoutList,
    className: "border-pink-200/80 bg-pink-400/35",
    iconClassName: "bg-pink-100 text-pink-500 ring-pink-200/80",
  },
  {
    number: "6",
    title: "Buat Budget Plan Bulanan",
    description:
      "Masuk ke Budgeting untuk membuat plan income, expense, savings, dan alokasi per kategori berdasarkan histori transaksi processed yang sudah rapi.",
    href: "/budgeting",
    cta: "Open budgeting",
    icon: PiggyBank,
    className: "border-emerald-200/80 bg-emerald-400/35",
    iconClassName: "bg-emerald-100 text-emerald-500 ring-emerald-200/80",
  },
  {
    number: "7",
    title: "Lanjut ke Category Insights, Recurring, dan Reports",
    description:
      "Setelah data dan budget plan sudah rapi, gunakan Category Insights untuk melihat performa kategori, Recurring untuk transaksi berulang, lalu Reports untuk rangkuman bulanan dan cash flow.",
    href: "/analytics",
    cta: "Open category insights",
    icon: FolderKanban,
    className: "border-violet-200/80 bg-violet-400/35",
    iconClassName: "bg-violet-100 text-violet-500 ring-violet-200/80",
  },
];

const followUpLinks = [
  {
    title: "Recurring",
    description: "Deteksi transaksi berulang seperti tagihan, subscription, atau pemasukan rutin.",
    href: "/recurring",
    cta: "Open recurring",
    icon: Repeat2,
  },
  {
    title: "Reports",
    description: "Lihat ringkasan bulanan, distribusi income/expense, dan report siap review.",
    href: "/reports",
    cta: "Open reports",
    icon: FolderKanban,
  },
];

export function GuideWorkspace() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/" />}>
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Guide</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">

            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Cara Pakai MBG
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              MBG paling enak dipakai sebagai workflow bertahap: rapikan data
              dulu, baru masuk ke klasifikasi, lalu analisis. Halaman ini
              menjelaskan urutan kerja yang paling aman untuk user baru.
            </p>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mainSteps.map((step) => {
            const Icon = step.icon;

            return (
              <Card key={step.number} className={step.className}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge variant="outline" className="rounded-full bg-background/80">
                        Step {step.number}
                      </Badge>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                    </div>
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ring-1 ${step.iconClassName}`}
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </CardDescription>
                  <Button variant="outline" size="sm" render={<Link href={step.href} />}>
                    {step.cta}
                    <ArrowRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <Card className="border-border bg-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CircleHelp className="size-4 text-muted-foreground" />
                <CardTitle>Urutan Kerja Yang Disarankan</CardTitle>
              </div>
              <CardDescription>
                Kalau bingung mulai dari mana, ikuti urutan ini tanpa melompat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Jangan langsung masuk ke report kalau file belum direview, karena
                data yang salah akan ikut terbawa ke kategori dan analitik.
              </p>
              <p>
                Jangan langsung edit merchant mapping kalau kategori dasarnya
                belum rapi. Struktur kategori lebih dulu, lalu merchant mapping,
                lalu review transaksi yang masih ambigu.
              </p>
              <p>
                Setelah data sudah stabil, susun dulu plan di <span className="font-medium text-foreground">Budgeting</span>, lalu gunakan <span className="font-medium text-foreground">Category Insights</span>,{" "}
                <span className="font-medium text-foreground">Recurring</span>, dan{" "}
                <span className="font-medium text-foreground">Reports</span> sebagai
                lapisan insight, bukan sebagai tempat membersihkan data mentah.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Setelah Step 6</CardTitle>
                <CardDescription>
                  Dua halaman ini biasanya paling sering dipakai setelah alur utama selesai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {followUpLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-lg border border-border bg-muted/20 px-3 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">
                              {item.title}
                            </p>
                          </div>
                          <p className="text-xs leading-5 text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        render={<Link href={item.href} />}
                      >
                        {item.cta}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Tips Singkat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Kalau banyak transaksi masih salah kategori, cek dulu{" "}
                  <span className="font-medium text-foreground">Merchants</span>
                  , bukan langsung override satu-satu.
                </p>
                <p>
                  Kalau kategori yang dibutuhkan belum ada, tambah atau edit di{" "}
                  <span className="font-medium text-foreground">Rules</span>.
                </p>
                <p>
                  Kalau parse file belum bersih, kembali ke{" "}
                  <span className="font-medium text-foreground">Review Queue</span>
                  sebelum melanjutkan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
