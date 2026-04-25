"use client";

import { useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CupertinoActionButton } from "@/components/ui/cupertino-action-button";
import { CupertinoConfirmDialog } from "@/components/ui/cupertino-confirm-dialog";
import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { useAppSettings } from "@/hooks/use-app-settings";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import { cn } from "@/lib/utils";

const bankOptions = [
  { value: "bca", label: "BCA" },
  { value: "mandiri", label: "Mandiri" },
  { value: "bni", label: "BNI" },
  { value: "bri", label: "BRI" },
  { value: "cimb", label: "CIMB Niaga" },
];

const parserModeOptions = [
  { value: "balanced", label: "Balanced", note: "Lebih fleksibel untuk variasi format PDF." },
  { value: "strict", label: "Strict", note: "Lebih ketat dan cocok untuk format yang konsisten." },
] as const;

const densityOptions = [
  { value: "comfortable", label: "Comfortable", note: "Jarak komponen lebih lega." },
  { value: "compact", label: "Compact", note: "Tabel lebih rapat dan padat." },
] as const;

const themeOptions = [
  { value: "light", label: "Light", note: "Selalu tampil terang." },
  { value: "dark", label: "Dark", note: "Selalu tampil gelap." },
  { value: "system", label: "System", note: "Ikuti preferensi OS." },
] as const;

type ConfirmAction = "reset-workspace" | "reset-settings" | null;

function getBankLabel(value: string) {
  return bankOptions.find((b) => b.value === value)?.label ?? "Pilih bank";
}

function OptionCard({
  label,
  note,
  selected,
  onClick,
}: {
  label: string;
  note: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[12px] border px-4 py-3 text-left transition-colors",
        selected
          ? "border-[#007aff]/30 bg-[#007aff]/[0.06]"
          : "border-black/[0.06] dark:border-white/10 bg-[#f7f7f8] dark:bg-[#2c2c2e] hover:bg-[#ededf0] dark:hover:bg-[#3a3a3c]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-[13px] font-semibold", selected ? "text-[#007aff]" : "text-[#1c1c1e] dark:text-[#f2f2f7]")}>
          {label}
        </p>
        {selected ? (
          <CupertinoIcon name="check" className="size-3.5 text-[#007aff]" />
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-5 text-[#8e8e93]">{note}</p>
    </button>
  );
}

function PreferenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.07] py-3 last:border-0">
      <span className="text-[11px] text-[#8e8e93]">{label}</span>
      <span className="text-[11px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7] capitalize">{value}</span>
    </div>
  );
}

export function SettingsWorkspace() {
  const { settings, isHydrated, updateSettings, resetSettings } = useAppSettings();
  const { resetAll } = useFileWorkspace();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  function handleResetWorkspace() {
    resetAll();
    toast("Workspace direset", {
      description: "Semua file, transaksi, dan activity lokal dihapus.",
    });
  }

  function handleResetSettings() {
    resetSettings();
    toast("Settings direset", {
      description: "Preferensi kembali ke nilai default.",
    });
  }

  return (
    <main className="min-h-svh flex-1 bg-[#f2f2f4] dark:bg-black text-[#1c1c1e] dark:text-[#f2f2f7]">
      <section className="sticky top-[58px] z-10 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#1c1c1e] md:top-0">
        <div className="flex w-full items-center gap-3 px-3 py-2.5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#1c1c1e] dark:text-[#f2f2f7]">
            Settings
          </h1>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 px-3 py-3">
        {/* Appearance */}
        <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f2f2f4] dark:bg-[#3a3a3c]">
              <CupertinoIcon name="home" className="size-3.5 text-[#636366] dark:text-[#8e8e93]" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Appearance</h2>
              <p className="text-[11px] text-[#8e8e93]">Atur tema dan kepadatan tampilan workspace.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#8e8e93]">Theme</p>
              <div className="grid gap-2 md:grid-cols-3">
                {themeOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    note={option.note}
                    selected={settings.theme === option.value}
                    onClick={() => updateSettings({ theme: option.value })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#8e8e93]">Display density</p>
              <div className="grid gap-2 md:grid-cols-2">
                {densityOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    label={option.label}
                    note={option.note}
                    selected={settings.displayDensity === option.value}
                    onClick={() => updateSettings({ displayDensity: option.value })}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Parser preferences */}
        <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[8px] bg-[#f2f2f4] dark:bg-[#3a3a3c]">
              <CupertinoIcon name="settings" className="size-3.5 text-[#636366] dark:text-[#8e8e93]" />
            </span>
            <div>
              <h2 className="text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Parser preferences</h2>
              <p className="text-[11px] text-[#8e8e93]">Pengaturan default yang dipakai saat upload file baru.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#8e8e93]">Default bank</p>
              <CupertinoSelect
                icon="wallet"
                value={settings.defaultBank}
                options={bankOptions}
                onChange={(value) => updateSettings({ defaultBank: value })}
                minWidthClassName="w-full"
                ariaLabel="Default bank"
              />
              <p className="text-[11px] text-[#8e8e93]">
                Bank ini akan terpilih otomatis saat membuka halaman File.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-medium text-[#8e8e93]">Parser mode</p>
              <CupertinoSelect
                icon="receipt"
                value={settings.parserMode}
                options={parserModeOptions.map((o) => ({ value: o.value, label: o.label }))}
                onChange={(value) => updateSettings({ parserMode: value as "balanced" | "strict" })}
                minWidthClassName="w-full"
                ariaLabel="Parser mode"
              />
              <p className="text-[11px] text-[#8e8e93]">
                {parserModeOptions.find((o) => o.value === settings.parserMode)?.note}
              </p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
          {/* Current preferences */}
          <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <h2 className="mb-3 text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Current preferences</h2>
            <div className="rounded-[12px] bg-[#f7f7f8] dark:bg-[#2c2c2e] px-4">
              <PreferenceRow label="Theme" value={isHydrated ? settings.theme : "-"} />
              <PreferenceRow label="Default bank" value={isHydrated ? getBankLabel(settings.defaultBank) : "-"} />
              <PreferenceRow label="Parser mode" value={isHydrated ? settings.parserMode : "-"} />
              <PreferenceRow label="Density" value={isHydrated ? settings.displayDensity : "-"} />
            </div>
          </section>

          {/* Workspace controls */}
          <section className="rounded-[13px] bg-white dark:bg-[#1c1c1e] p-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:shadow-none">
            <h2 className="mb-1 text-[13px] font-semibold text-[#1c1c1e] dark:text-[#f2f2f7]">Workspace controls</h2>
            <p className="mb-4 text-[11px] leading-5 text-[#8e8e93]">
              Reset preferensi tampilan atau hapus seluruh data workspace lokal.
            </p>
            <div className="space-y-2">
              <CupertinoActionButton
                tone="white"
                className="w-full justify-start gap-2"
                onClick={() => setConfirmAction("reset-settings")}
              >
                <RotateCcw className="size-3.5" />
                Reset settings
              </CupertinoActionButton>
              <CupertinoActionButton
                tone="white"
                className="w-full justify-start gap-2 text-[#ff453a] hover:bg-[#ff453a]/10"
                onClick={() => setConfirmAction("reset-workspace")}
              >
                <Trash2 className="size-3.5" />
                Reset workspace
              </CupertinoActionButton>
            </div>
          </section>
        </div>
      </div>

      <CupertinoConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          if (confirmAction === "reset-workspace") handleResetWorkspace();
          if (confirmAction === "reset-settings") handleResetSettings();
          setConfirmAction(null);
        }}
        title={confirmAction === "reset-workspace" ? "Reset workspace?" : "Reset settings?"}
        description={
          confirmAction === "reset-workspace"
            ? "Semua file, transaksi, activity, dan data lokal workspace akan dihapus dari browser ini."
            : "Semua preferensi tampilan, parser, dan default bank akan dikembalikan ke default."
        }
        confirmLabel="Confirm"
        tone={confirmAction === "reset-workspace" ? "destructive" : "default"}
      />
    </main>
  );
}
