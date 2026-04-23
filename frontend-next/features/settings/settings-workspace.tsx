"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, RotateCcw, Settings2, SunMoon, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useAppSettings } from "@/hooks/use-app-settings";
import { useFileWorkspace } from "@/hooks/use-file-workspace";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const bankOptions = [
  { value: "bca", label: "BCA" },
  { value: "mandiri", label: "Mandiri" },
  { value: "bni", label: "BNI" },
  { value: "bri", label: "BRI" },
  { value: "cimb", label: "CIMB Niaga" },
];

const parserModeOptions = [
  {
    value: "balanced",
    label: "Balanced",
    note: "Lebih fleksibel untuk variasi format PDF.",
  },
  {
    value: "strict",
    label: "Strict",
    note: "Lebih ketat dan cocok untuk format yang konsisten.",
  },
] as const;

const densityOptions = [
  {
    value: "comfortable",
    label: "Comfortable",
    note: "Jarak komponen lebih lega.",
  },
  {
    value: "compact",
    label: "Compact",
    note: "Tabel lebih rapat dan padat.",
  },
] as const;

type ConfirmAction = "reset-workspace" | "reset-settings" | null;

function getBankLabel(value: string) {
  return bankOptions.find((bank) => bank.value === value)?.label ?? "Pilih bank";
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
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Kelola preferensi parser, default bank, dan format tampilan
              workspace MBG.
            </p>
          </div>
        </section>

        <Separator />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <SunMoon className="size-4 text-muted-foreground" />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>
                  Atur kepadatan tampilan workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Display density
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {densityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          updateSettings({ displayDensity: option.value })
                        }
                        className={cn(
                          "rounded-lg border px-4 py-3 text-left transition-colors",
                          settings.displayDensity === option.value
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-foreground">
                            {option.label}
                          </p>
                          {settings.displayDensity === option.value ? (
                            <Check className="size-4 text-primary" />
                          ) : null}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {option.note}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Settings2 className="size-4 text-muted-foreground" />
                  <CardTitle>Parser preferences</CardTitle>
                </div>
                <CardDescription>
                  Pengaturan default yang dipakai saat upload file baru.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Default bank
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-10 w-full justify-between bg-background text-left text-sm",
                          )}
                        />
                      }
                    >
                      <span>{getBankLabel(settings.defaultBank)}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-popover">
                      {bankOptions.map((bank) => (
                        <DropdownMenuItem
                          key={bank.value}
                          onClick={() => updateSettings({ defaultBank: bank.value })}
                        >
                          {bank.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">
                    Bank ini akan terpilih otomatis saat membuka halaman File.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Parser mode
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-10 w-full justify-between bg-background text-left text-sm",
                          )}
                        />
                      }
                    >
                      <span>
                        {
                          parserModeOptions.find(
                            (option) => option.value === settings.parserMode,
                          )?.label
                        }
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-64 bg-popover">
                      {parserModeOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => updateSettings({ parserMode: option.value })}
                        >
                          <div className="space-y-0.5">
                            <p>{option.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {option.note}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-muted-foreground">
                    Preferensi ini disimpan untuk proses parsing berikutnya.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Current preferences</CardTitle>
                <CardDescription>
                  Snapshot singkat dari preferensi yang sedang aktif.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
                  <span className="text-muted-foreground">Theme</span>
                  <span className="font-medium text-foreground">
                    light
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
                  <span className="text-muted-foreground">Default bank</span>
                  <span className="font-medium text-foreground">
                    {isHydrated ? getBankLabel(settings.defaultBank) : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
                  <span className="text-muted-foreground">Parser mode</span>
                  <span className="font-medium text-foreground">
                    {settings.parserMode}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
                  <span className="text-muted-foreground">Density</span>
                  <span className="font-medium text-foreground">
                    {settings.displayDensity}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Workspace controls</CardTitle>
                <CardDescription>
                  Reset preferensi tampilan atau hapus seluruh data workspace lokal.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="h-10 w-full justify-start"
                  onClick={() => setConfirmAction("reset-settings")}
                >
                  <RotateCcw className="size-4" />
                  Reset settings
                </Button>
                <Button
                  variant="destructive"
                  className="h-10 w-full justify-start"
                  onClick={() => setConfirmAction("reset-workspace")}
                >
                  <Trash2 className="size-4" />
                  Reset workspace
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "reset-workspace"
                ? "Reset workspace?"
                : "Reset settings?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "reset-workspace"
                ? "Semua file, transaksi, activity, dan data lokal workspace akan dihapus dari browser ini."
                : "Semua preferensi tampilan, parser, dan default bank akan dikembalikan ke default."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction === "reset-workspace") {
                  handleResetWorkspace();
                }

                if (confirmAction === "reset-settings") {
                  handleResetSettings();
                }

                setConfirmAction(null);
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
