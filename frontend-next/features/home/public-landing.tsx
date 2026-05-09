"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  CircleHelp,
  Moon,
  Sparkles,
  SunMedium,
} from "lucide-react";
import { useTheme } from "next-themes";
import { defaultWallets } from "@/features/wallets/wallets";
import { formatCurrency } from "@/lib/formatters";

const navItems = [
  { label: "Fitur", href: "/#fitur" },
  { label: "Harga", href: "/#harga" },
  { label: "FAQ", href: "/#faq" },
];

const painPoints = [
  {
    emoji: "🌫️",
    title: "Kamu bukan tidak punya uang, kamu hanya kehilangan jejaknya.",
    description:
      "Saat saldo tersebar di 5 aplikasi bank berbeda, keputusan belanjamu hanya berdasarkan tebakan insting.",
  },
  {
    emoji: "😩",
    title: "Aplikasi lain terlalu ribet, spreadsheet terlalu kaku.",
    description:
      "Kamu butuh sistem yang mengerti bahwa kamu punya kehidupan selain hanya mencatat pengeluaran.",
  },
  {
    emoji: "🪤",
    title: "Menabung di akhir bulan adalah mitos.",
    description:
      "Tanpa alokasi otomatis sejak hari pertama gajian, uangmu akan selalu menemukan cara untuk habis.",
  },
];

const featureCards = [
  {
    badge: "",
    emoji: "💳",
    title: "All-in-One Command Center",
    description:
      "Satukan pandangan mata untuk semua saldo aktifmu di satu layar dashboard yang bersih dan gampang dipantau setiap hari.",
  },
  {
    badge: "",
    emoji: "📐",
    title: "Strict but Flexible Budgeting",
    description:
      "Atur limit tiap kategori. Dapatkan notifikasi saat kamu mulai mendekati batas \"bahaya\" belanja.",
  },
  {
    badge: "",
    emoji: "💬",
    title: "WhatsApp Transaction Logging",
    description:
      "Rekam pengeluaran secepat mengirim pesan singkat tanpa perlu buka aplikasi dashboard.",
  },
  {
    badge: "",
    emoji: "📸",
    title: "Itemized Receipt Scanner",
    description:
      "AI yang mengenali setiap baris belanjaan di struk, memungkinkan kamu melihat detail pengeluaran terkecil sekalipun.",
  },
  {
    badge: "",
    emoji: "🔗",
    title: "Seamless Split-Bill",
    description:
      "Bagi transaksi secara adil dengan link sharable yang terhubung langsung ke data asli di dashboard.",
  },
  {
    badge: "",
    emoji: "📈",
    title: "Advanced Import Workflow",
    description:
      "Sistem impor mutasi cerdas yang mendeteksi duplikasi dan mengkategorikan transaksi secara otomatis.",
  },
  {
    badge: "",
    emoji: "👛",
    title: "Multi Wallet",
    description:
      "Kelola semua rekening bank, e-wallet, kartu kredit, dan PayLater dalam satu tampilan yang terorganisir.",
  },
  {
    badge: "",
    emoji: "🎯",
    title: "Nabung dengan target yang jelas",
    description:
      "Buat goals dengan deadline dan target nominal, lalu lihat progressnya berjalan tiap bulan.",
  },
];

const individualFeatures = [
  "All-in-One Command Center",
  "Strict but Flexible Budgeting",
  "WhatsApp Transaction Logging",
  "Advanced Import Workflow",
  "Seamless Split-Bill",
  "Itemized Receipt Scanner",
  "Multi Wallet",
  "Nabung dengan target yang jelas",
];

const familyFeatures = [
  "Semua fitur Individu",
  "Dashboard sharing untuk keluarga",
  "Wallets bersama untuk kebutuhan rumah tangga",
  "Kolaborasi budgeting bersama",
];

const testimonials = [
  {
    name: "Sarah D",
    handle: "@sarah*******",
    quote: "guysss kalian wajib coba. setelah sekian lama mencari akhirnya ketemu juga yang cocok. 10/10!",
  },
  {
    name: "Alex",
    handle: "@alex*****",
    quote: "akhirnya nemu app yang gak kayak Excel tahun 98. tampilannya rapi dan sat set.",
  },
  {
    name: "Dina P",
    handle: "@dinad****",
    quote: "fitur net worth dan budgeting-nya bikin aku jauh lebih semangat buat ngatur duit.",
  },
  {
    name: "Rizky M. K.",
    handle: "@rizky_******",
    quote: "gue udah ga pake spreadsheet lagi. flow import sama kategorinya jauh lebih cepet.",
  },
  {
    name: "Jessy K",
    handle: "@jess*****",
    quote: "ternyata aku bisa nabung juga. pas ada sistemnya, keputusan bulanan jadi lebih tenang.",
  },
];

const faqs = [
  "Apakah data keuangan saya aman?",
  "Apakah Nidhi.id bisa sync otomatis dengan rekening bank saya?",
  "Apa perbedaan STARTER dan PRO?",
  "Gimana cara bayarnya?",
  "Apakah ada perpanjangan otomatis?",
  "Bisa dipakai di HP dan laptop sekaligus?",
];

function CountUpAmount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const totalFrames = 42;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(value * eased));
      if (progress >= 1) {
        window.clearInterval(timer);
      }
    }, 24);

    return () => window.clearInterval(timer);
  }, [value]);

  return <span className="tabular-nums">{formatCurrency(display)}</span>;
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-tertiary">
        {eyebrow}
      </p>
      <h2 className="landing-text-primary mt-3 font-heading text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="landing-text-muted mt-3 text-sm leading-7 sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function PricingCards() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const isYearly = billing === "yearly";

  const individu = {
    monthly: "Rp 9rb",
    yearly: "Rp 7rb",
    yearlyTotal: "Rp 84rb",
    save: "Hemat 22%",
  };

  const family = {
    monthly: "Rp 12rb",
    yearly: "Rp 9rb",
    yearlyTotal: "Rp 108rb",
    save: "Hemat 25%",
  };

  return (
    <div className="mt-8">
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="inline-flex items-center rounded-full border border-subtle bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              !isYearly
                ? "bg-surface text-primary shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              isYearly
                ? "bg-surface text-primary shadow-sm"
                : "text-secondary hover:text-primary"
            }`}
          >
            Tahunan
          </button>
        </div>
        
      </div>

      <div className="mx-auto mt-5 grid max-w-5xl gap-4 lg:grid-cols-2">
        <article className="landing-panel-soft rounded-[32px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                INDIVIDU
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="landing-text-primary font-heading text-4xl font-semibold tracking-[-0.06em]">
                  {isYearly ? individu.yearly : individu.monthly}
                </span>
                <span className="landing-text-muted pb-1 text-sm">/bulan</span>
                {isYearly && (
                  <span className="landing-text-soft mb-1 text-sm line-through">
                    {individu.monthly}
                  </span>
                )}
              </div>
              {isYearly ? (
                <p className="mt-1.5 text-xs font-medium text-success">
                  {individu.save} · ditagih {individu.yearlyTotal}/tahun
                </p>
              ) : (
                <p className="landing-text-soft mt-1.5 text-xs">
                  atau {individu.yearly}/bln jika bayar tahunan
                </p>
              )}
              <p className="landing-text-muted mt-2 text-sm">
                Untuk kamu yang ingin rapi secara mandiri
              </p>
            </div>
            <span className="rounded-full bg-(--accent)/10 px-2.5 py-1 text-[11px] font-medium text-accent">
              Personal
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {individualFeatures.map((feature) => (
              <div key={feature} className="landing-text-primary flex items-center gap-3 text-sm">
                <span className="landing-check flex size-4 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--landing-success)_12%,transparent)]">
                  <Check className="size-3" strokeWidth={1.75} />
                </span>
                {feature}
              </div>
            ))}
          </div>

          <Link
            href="/?auth=signup"
            scroll={false}
            className="landing-text-primary mt-7 inline-flex h-12 items-center justify-center rounded-[14px] border border-subtle px-5 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            Mulai dengan Individu
          </Link>
        </article>

        <article className="landing-family-gradient rounded-[32px] border p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">
                FAMILY
              </p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-heading text-4xl font-semibold tracking-[-0.06em]">
                  {isYearly ? family.yearly : family.monthly}
                </span>
                <span className="pb-1 text-sm text-white/76">/user/bulan</span>
                {isYearly && (
                  <span className="mb-1 text-sm text-white/50 line-through">
                    {family.monthly}
                  </span>
                )}
              </div>
              {isYearly ? (
                <p className="mt-1.5 text-xs font-medium text-white/80">
                  {family.save} · ditagih {family.yearlyTotal}/user/tahun
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-white/56">
                  atau {family.yearly}/user/bln jika bayar tahunan
                </p>
              )}
              <p className="mt-2 text-sm text-white/78">
                Transparansi tanpa kehilangan privasi — kelola anggaran
                rumah tangga bersama pasangan tanpa harus berbagi saldo
                rekening pribadi
              </p>
            </div>
            <span className="rounded-full bg-white/12 px-2.5 py-1 text-[11px] font-medium text-white">
              Shared
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {familyFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-sm text-white">
                <span className="landing-check flex size-4 shrink-0 items-center justify-center rounded-full bg-white/12 text-white">
                  <Check className="size-3" strokeWidth={1.75} />
                </span>
                {feature}
              </div>
            ))}
          </div>

          <Link
            href="/?auth=signup"
            scroll={false}
            className="mt-7 inline-flex h-12 items-center justify-center rounded-[14px] bg-white px-5 text-sm font-medium text-[#0f3ea8] transition-transform hover:-translate-y-0.5"
          >
            Mulai dengan Family
          </Link>
        </article>
      </div>
    </div>
  );
}

export function PublicLanding() {
  const { resolvedTheme, setTheme } = useTheme();
  const heroWallets = useMemo(() => defaultWallets.slice(0, 5), []);
  const testimonialItems = useMemo(
    () => [...testimonials, ...testimonials],
    [],
  );

  function handleScrollToTop(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.history.replaceState(null, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const isDarkMode = resolvedTheme === "dark";

  function handleThemeToggle() {
    setTheme(isDarkMode ? "light" : "dark");
  }

  return (
    <main
      id="top"
      className="relative min-h-screen overflow-hidden bg-[var(--landing-bg)]"
    >
      <div className="relative z-10">
        <header className="fixed top-0 right-0 left-0 z-30 border-b border-subtle bg-surface/90 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              scroll={false}
              onClick={handleScrollToTop}
              className="flex min-w-0 items-center gap-[9px]"
            >
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-[var(--text-primary)] text-[11px] font-semibold text-white">
                B.
              </span>
              <p className="truncate text-sm font-semibold tracking-[-0.2px] text-primary">
                Nidhi.id
              </p>
            </Link>

            <nav className="mx-auto hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-full px-3 py-2 text-sm text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={handleThemeToggle}
                aria-label={isDarkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
                title={isDarkMode ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
                className="inline-flex size-10 items-center justify-center rounded-[10px] border border-subtle bg-surface text-secondary transition-colors hover:bg-surface-muted hover:text-primary"
              >
                {isDarkMode ? (
                  <SunMedium className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
              <div className="hidden items-center gap-2 sm:flex">
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-secondary">
                  ID
                </span>
                <Link
                  href="/?auth=login"
                  scroll={false}
                  className="inline-flex h-10 items-center justify-center rounded-[10px] border border-subtle px-4 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
                >
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:px-8 lg:pb-24 lg:pt-34">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-subtle bg-surface/78 px-3 py-1.5 text-xs font-medium text-secondary backdrop-blur-xl">
              <Sparkles className="size-3.5 text-accent" />
              Aman dan dibuat khusus untukmu
            </div>

            <h1 className="landing-text-primary mt-6 max-w-3xl font-heading text-[3.8rem] font-medium leading-[0.88] tracking-[-0.04em] sm:text-[5.7rem]">
              Akhiri Drama
              <br />
              &quot;Uang Habis
              <br />
              ke Mana&quot;
            </h1>

            <p className="landing-text-muted mt-5 max-w-2xl text-base leading-8">
              Nidhi.id menggabungkan kecepatan import data dengan presisi
              budgeting profesional. Satu tempat untuk memantau semua rekening
              tanpa harus pusing dengan rumus spreadsheet.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/?auth=signup"
                scroll={false}
                className="inline-flex h-12 items-center justify-center rounded-[14px] bg-[var(--accent)] px-6 text-sm font-medium text-white shadow-[0_18px_36px_rgb(0_122_255/0.2)] transition-transform hover:-translate-y-0.5"
              >
                Klaim Kendali Keuanganku
              </Link>
              <button
                type="button"
                className="inline-flex h-12 items-center justify-center rounded-[14px] border border-subtle bg-surface px-6 text-sm font-medium text-primary transition-colors hover:bg-surface-muted"
              >
                Intip Cara Kerjanya
              </button>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex -space-x-2">
                {heroWallets.map((wallet, index) => (
                  <span
                    key={wallet.id}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
                    style={{
                      background:
                        index === 0
                          ? "var(--accent)"
                          : index === 1
                            ? "var(--warning)"
                            : index === 2
                              ? "#0f3ea8"
                              : index === 3
                                ? "#1f2937"
                                : "#475569",
                    }}
                  >
                    {`U${index + 1}`}
                  </span>
                ))}
              </div>
              <p className="landing-text-muted text-sm">
                Bergabung dengan{" "}
                <span className="landing-text-primary font-semibold">1.000+</span>{" "}
                pengguna yang sudah beralih dari pencatatan manual.
              </p>
            </div>
          </div>

          <div className="grid items-center gap-4">
            <div className="landing-panel mx-auto w-full max-w-[560px] rounded-[32px] p-4">
              <div className="rounded-[26px] border border-[var(--landing-border)] bg-[var(--landing-hero-gradient)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-tertiary">
                      Nidhi.id app demo
                    </p>
                    <p className="landing-text-primary mt-3 text-3xl font-semibold tracking-[-0.05em]">
                      <CountUpAmount value={28416000} />
                    </p>
                    <p className="landing-text-muted mt-1 text-sm">
                      Total saldo aktif dari semua dompet
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
                    +8.2% bulan ini
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="landing-family-gradient rounded-[20px] p-4 text-white">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                      Budget status
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
                      On track
                    </p>
                    <p className="mt-1 text-sm text-white/78">
                      124 transaksi berhasil dikategorikan
                    </p>
                  </div>

                  <div className="landing-panel-soft rounded-[20px] p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-tertiary">
                      Wallet aktif
                    </p>
                    <div className="mt-3 flex -space-x-2">
                      {heroWallets.map((wallet) => (
                        <span
                          key={wallet.id}
                          className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white text-[11px] font-bold text-white"
                          style={{ background: wallet.color }}
                        >
                          {wallet.abbr}
                        </span>
                      ))}
                    </div>
                    <p className="landing-text-primary mt-3 text-sm font-medium">
                      5 dompet terhubung
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionTitle
            eyebrow="Masalah yang Sering Terjadi"
            title="Mengapa Mengatur Uang Terasa Sangat Berat?"
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {painPoints.map((item) => (
              <article
                key={item.title}
                className="landing-panel-soft rounded-[28px] p-6"
              >
                <p className="text-3xl">{item.emoji}</p>
                <h3 className="landing-text-primary mt-4 font-heading text-xl font-semibold tracking-[-0.04em]">
                  {item.title}
                </h3>
                <p className="landing-text-muted mt-3 text-sm leading-7">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="fitur" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionTitle
            eyebrow="Fitur"
            title="Minimalism Meets Power."
            description="Semua yang kamu butuhkan untuk akhirnya punya kontrol penuh atas keuanganmu — dari fitur dasar hingga tools PRO yang benar-benar beda."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="landing-panel-soft rounded-[28px] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-2xl">{card.emoji}</span>
                  {card.badge ? (
                    <span className="rounded-full bg-[#0f3ea8] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="landing-text-primary mt-4 font-heading text-xl font-semibold tracking-[-0.04em]">
                  {card.title}
                </h3>
                <p className="landing-text-muted mt-3 text-sm leading-7">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="harga" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionTitle
            eyebrow="Harga"
            title="The Cost of Peace of Mind."
            description="Pilih paket untuk kebutuhan personal atau keluarga. Investasi kecil dengan dampak besar — karena kamu akhirnya punya sistem yang bisa benar-benar dijalankan."
          />

          <PricingCards />
        </section>

        <section className="relative left-1/2 right-1/2 -mx-[50vw] w-screen scroll-mt-24 bg-[var(--landing-testimonial-bg)] py-20 lg:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle
              eyebrow="Kata Mereka"
              title="Ini kata mereka, bukan kata kita."
            />

            <div className="relative mt-8 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-[linear-gradient(90deg,var(--landing-testimonial-fade)_0%,rgba(0,0,0,0)_100%)]" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-[linear-gradient(270deg,var(--landing-testimonial-fade)_0%,rgba(0,0,0,0)_100%)]" />

              <div className="landing-testimonial-marquee flex w-max gap-4 pr-4">
                {testimonialItems.map((item, index) => (
                  <article
                    key={`${item.name}-${index}`}
                    className="landing-panel-soft w-[320px] shrink-0 rounded-[28px] p-5 sm:w-[360px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-semibold text-accent">
                        {item.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <div>
                        <p className="landing-text-primary text-sm font-semibold">{item.name}</p>
                        <p className="landing-text-muted text-[11px]">{item.handle}</p>
                      </div>
                    </div>
                    <p className="landing-text-muted mt-4 text-sm leading-7">
                      “{item.quote}”
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <SectionTitle
            eyebrow="FAQ"
            title="Pertanyaan yang sering ditanyakan"
          />

          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq}
                className="landing-panel-soft group rounded-[22px] p-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-[12px] bg-surface-muted text-tertiary">
                      <CircleHelp className="size-4" />
                    </span>
                    <span className="landing-text-primary text-sm font-semibold">{faq}</span>
                  </div>
                  <ChevronDown className="size-4 text-tertiary transition-transform group-open:rotate-180" />
                </summary>
                <p className="landing-text-muted pt-4 pl-12 text-sm leading-7">
                  Kami siapkan alur yang sederhana, aman, dan tetap fleksibel.
                  Jawaban detail bisa disesuaikan lebih lanjut saat dokumentasi
                  produk final sudah lengkap.
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="landing-family-gradient rounded-[36px] border px-6 py-10 text-white sm:px-8 sm:py-12">
            <h2 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
              Berikan Kado Terbaik untuk Dirimu di Masa Depan.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
              Mulai bangun fondasi finansial yang kuat hari ini. Tanpa ribet,
              tanpa drama, hanya hasil nyata.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/?auth=signup"
                scroll={false}
                className="inline-flex h-12 items-center justify-center rounded-[14px] bg-white px-6 text-sm font-medium text-[#0f3ea8] transition-transform hover:-translate-y-0.5"
              >
                Ambil Kendali Sekarang
              </Link>
              <p className="text-sm text-white/76">
                Mulai dari Rp 9rb per bulan
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-6 border-t border-subtle bg-surface/88 backdrop-blur-xl">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div>
              <div className="flex items-center gap-[9px]">
                <span className="flex size-[26px] items-center justify-center rounded-[7px] bg-[var(--text-primary)] text-[11px] font-semibold text-white">
                  B.
                </span>
                <p className="text-sm font-semibold tracking-[-0.2px] text-primary">
                  Nidhi.id
                </p>
              </div>
              <p className="mt-4 max-w-md text-sm leading-7 text-secondary">
                Nidhi.id adalah aplikasi keuangan buat kamu yang ingin ngatur
                keuangan tanpa ribet dan tanpa tenggelam di spreadsheet.
              </p>
              <p className="mt-4 text-sm font-medium text-primary">
                Layanan Pelanggan: +62 813 7506 8899
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                  Produk
                </p>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <Link href="/#fitur" className="text-secondary transition-colors hover:text-primary">
                    Fitur
                  </Link>
                  <Link href="/#harga" className="text-secondary transition-colors hover:text-primary">
                    Harga
                  </Link>
                  <Link href="/#faq" className="text-secondary transition-colors hover:text-primary">
                    FAQ
                  </Link>
                  <Link href="/?auth=login" scroll={false} className="text-secondary transition-colors hover:text-primary">
                    Masuk
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-tertiary">
                  Sumber Daya
                </p>
                <div className="mt-4 flex flex-col gap-3 text-sm">
                  <Link href="/?auth=signup" scroll={false} className="text-secondary transition-colors hover:text-primary">
                    Install Aplikasi
                  </Link>
                  <Link href="/guide" className="text-secondary transition-colors hover:text-primary">
                    Bantuan
                  </Link>
                  <Link href="/guide" className="text-secondary transition-colors hover:text-primary">
                    Syarat dan Ketentuan
                  </Link>
                  <Link href="/guide" className="text-secondary transition-colors hover:text-primary">
                    Kebijakan Privasi
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-subtle">
            <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-secondary sm:px-6 lg:px-8">
              © 2026 Nidhi.id. Hak cipta dilindungi.
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
