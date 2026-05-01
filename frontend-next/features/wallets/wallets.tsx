"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { APP_COLOR_OPTIONS } from "@/lib/color-palette";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CupertinoSelect } from "@/components/ui/cupertino-select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { WorkspacePrimaryButton } from "@/components/ui/workspace-primary-button";

export type WalletTone = (typeof APP_COLOR_OPTIONS)[number]["walletTone"];

export type Wallet = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  tone: WalletTone;
  abbr: string;
  color: string;
};

const WALLETS_STORAGE_KEY = "nidhi_wallets";
const LEGACY_WALLETS_STORAGE_KEY = "nidhi_dashboard_wallets";
const ACTIVE_WALLET_STORAGE_KEY = "nidhi_active_wallet";
const LEGACY_ACTIVE_WALLET_STORAGE_KEY = "nidhi_dashboard_active_wallet";
const WALLET_CHANGE_EVENT = "nidhi-wallets-change";

const walletColorOptions = APP_COLOR_OPTIONS.map((option) => ({
  name: option.name,
  tone: option.walletTone,
  color: option.color,
}));

export const defaultWallets: Wallet[] = [
  {
    id: "wallet-bca",
    name: "BCA",
    institution: "Bank Central Asia",
    balance: 18450000,
    tone: "blue",
    abbr: "BK",
    color: "var(--accent)",
  },
  {
    id: "wallet-mandiri",
    name: "Mandiri",
    institution: "Bank Mandiri",
    balance: 5230000,
    tone: "orange",
    abbr: "MD",
    color: "var(--warning)",
  },
  {
    id: "wallet-chase",
    name: "Chase Sapphire",
    institution: "Credit card",
    balance: 1260000,
    tone: "slate",
    abbr: "CH",
    color: "var(--accent)",
  },
  {
    id: "wallet-amex",
    name: "Amex Gold",
    institution: "Credit card",
    balance: 3120000,
    tone: "orange",
    abbr: "AM",
    color: "var(--warning)",
  },
];

function normalizeWallet(value: unknown): Wallet | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const wallet = value as Partial<Wallet>;
  const isValid =
    typeof wallet.id === "string" &&
    typeof wallet.name === "string" &&
    typeof wallet.institution === "string" &&
    typeof wallet.balance === "number" &&
    (wallet.tone === "blue" ||
      wallet.tone === "green" ||
      wallet.tone === "orange" ||
      wallet.tone === "slate");

  if (!isValid) {
    return null;
  }

  const walletId = typeof wallet.id === "string" ? wallet.id : "";
  const walletName = typeof wallet.name === "string" ? wallet.name : "";
  const walletInstitution =
    typeof wallet.institution === "string" ? wallet.institution : "";
  const walletBalance =
    typeof wallet.balance === "number" ? wallet.balance : 0;
  const walletTone =
    wallet.tone === "blue" ||
    wallet.tone === "green" ||
    wallet.tone === "orange" ||
    wallet.tone === "slate"
      ? wallet.tone
      : "slate";
  const initials = walletName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: walletId,
    name: walletName,
    institution: walletInstitution,
    balance: walletBalance,
    tone: walletTone,
    abbr: wallet.abbr || initials || "WL",
    color: wallet.color || "var(--text-secondary)",
  };
}

function loadWallets() {
  if (typeof window === "undefined") {
    return defaultWallets;
  }

  try {
    const raw =
      window.localStorage.getItem(WALLETS_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_WALLETS_STORAGE_KEY);
    if (!raw) {
      return defaultWallets;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultWallets;
    }

    const normalized = parsed
      .map(normalizeWallet)
      .filter((wallet): wallet is Wallet => Boolean(wallet));

    return normalized.length > 0 ? normalized : defaultWallets;
  } catch {
    return defaultWallets;
  }
}

function loadActiveWallet() {
  if (typeof window === "undefined") {
    return "all";
  }

  return (
    window.localStorage.getItem(ACTIVE_WALLET_STORAGE_KEY) ||
    window.localStorage.getItem(LEGACY_ACTIVE_WALLET_STORAGE_KEY) ||
    "all"
  );
}

function emitWalletChange() {
  window.dispatchEvent(new Event(WALLET_CHANGE_EVENT));
}

function subscribeToWallets(callback: () => void) {
  window.addEventListener(WALLET_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(WALLET_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getWalletSnapshot() {
  return JSON.stringify({
    wallets: loadWallets(),
    activeWallet: loadActiveWallet(),
  });
}

function getServerWalletSnapshot() {
  return JSON.stringify({
    wallets: defaultWallets,
    activeWallet: "all",
  });
}

export function useWallets() {
  const snapshot = useSyncExternalStore(
    subscribeToWallets,
    getWalletSnapshot,
    getServerWalletSnapshot,
  );

  const { wallets, activeWallet } = useMemo(
    () =>
      JSON.parse(snapshot) as {
        wallets: Wallet[];
        activeWallet: string;
      },
    [snapshot],
  );

  function setActiveWallet(walletName: string) {
    window.localStorage.setItem(ACTIVE_WALLET_STORAGE_KEY, walletName);
    emitWalletChange();
  }

  function addWallet(payload: {
    name: string;
    institution: string;
    balance: number;
    tone: WalletTone;
    color: string;
  }) {
    const nextWallet: Wallet = {
      id: `wallet-${Date.now()}`,
      name: payload.name.trim(),
      institution: payload.institution.trim() || "Manual wallet",
      balance: Number.isFinite(payload.balance) ? payload.balance : 0,
      tone: payload.tone,
      abbr:
        payload.name
          .trim()
          .split(/\s+/)
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() || "WL",
      color: payload.color,
    };

    if (!nextWallet.name) {
      return;
    }

    const nextWallets = [nextWallet, ...wallets];
    window.localStorage.setItem(WALLETS_STORAGE_KEY, JSON.stringify(nextWallets));
    window.localStorage.setItem(ACTIVE_WALLET_STORAGE_KEY, nextWallet.name);
    emitWalletChange();
  }

  return {
    wallets,
    activeWallet,
    setActiveWallet,
    addWallet,
  };
}

export function WalletDot({ tone }: { tone: WalletTone }) {
  return (
    <span
      className={cn(
        "size-2.5 rounded-full",
        tone === "blue" && "bg-[var(--accent)]",
        tone === "green" && "bg-success",
        tone === "orange" && "bg-warning",
        tone === "slate" && "bg-[var(--text-primary)] dark:bg-surface-raised",
      )}
    />
  );
}

export function WalletSelect({
  ariaLabel = "Select wallet",
}: {
  ariaLabel?: string;
}) {
  const { wallets, activeWallet, setActiveWallet } = useWallets();

  return (
    <CupertinoSelect
      icon="wallet"
      value={activeWallet}
      onChange={setActiveWallet}
      ariaLabel={ariaLabel}
      options={[
        {
          value: "all",
          label: "All wallets",
          leadingIcon: "wallet",
          leadingColor: "var(--accent)",
        },
        ...wallets.map((wallet) => ({
          value: wallet.name,
          label: wallet.name,
          leadingLabel: wallet.abbr,
          leadingColor: wallet.color,
        })),
      ]}
    />
  );
}

export function WalletList({
  className,
  onAddWallet,
  iconEnd,
}: {
  className?: string;
  onAddWallet: () => void;
  iconEnd?: React.ReactNode;
}) {
  const { wallets, activeWallet, setActiveWallet } = useWallets();
  const [isOpen, setIsOpen] = useState(false);
  const selectedWallet =
    activeWallet === "all"
      ? null
      : wallets.find((wallet) => wallet.name === activeWallet) ?? null;
  const selectedLabel = selectedWallet?.name ?? "All Wallets";

  return (
    <div className={cn("relative", className)}>
      <div className="pl-2.5 pb-0.75 text-[10px] font-semibold tracking-[0.07em] text-[var(--text-tertiary)] dark:text-[var(--text-secondary)] uppercase">
        Wallets
      </div>

      <button
        className={cn(
          "mb-px flex h-[36px] w-full items-center gap-[9px] rounded-[8px] border-0 px-2.5 text-left",
          "bg-(--accent)/8 hover:bg-(--accent)/10 dark:bg-(--accent)/10 dark:hover:bg-(--accent)/14",
        )}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        aria-expanded={isOpen}
      >
        {selectedWallet ? (
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-[6px] text-[7px] font-bold tracking-[0.02em] text-white"
            style={{ background: selectedWallet.color }}
          >
            {selectedWallet.abbr}
          </span>
        ) : (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[var(--accent)]">
            <CupertinoIcon name="wallet" className="size-3 text-white" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-accent">
          {selectedLabel}
        </span>
        {iconEnd ? <span className="ml-auto flex size-3.5 items-center">{iconEnd}</span> : null}
      </button>

      {isOpen ? (
        <div className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 rounded-[10px] border border-white/35 bg-white/88 p-1 shadow-[0_18px_38px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/6 dark:bg-[rgb(28_32_44/0.88)] dark:shadow-[0_18px_38px_rgba(0,0,0,0.42)]">
          <button
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left transition-colors",
              activeWallet === "all"
                ? "bg-(--accent)/8 ring-1 ring-(--accent)/15 dark:bg-white/10 dark:ring-white/8"
                : "hover:bg-surface/40 dark:hover:bg-white/8",
            )}
            onClick={() => {
              setActiveWallet("all");
              setIsOpen(false);
            }}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-[var(--accent)]">
              <CupertinoIcon name="wallet" className="size-3.5 text-white" />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-xs font-medium",
                activeWallet === "all" ? "text-accent" : "text-primary",
              )}
            >
              All Wallets
            </span>
            {activeWallet === "all" ? (
              <CupertinoIcon name="check" className="size-3.5 text-accent" />
            ) : null}
          </button>

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left transition-colors",
                activeWallet === wallet.name
                  ? "bg-(--accent)/8 ring-1 ring-(--accent)/15 dark:bg-white/10 dark:ring-white/8"
                  : "hover:bg-surface/40 dark:hover:bg-white/8",
              )}
              onClick={() => {
                setActiveWallet(wallet.name);
                setIsOpen(false);
              }}
              type="button"
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-[7px] text-[8px] font-bold tracking-[0.02em] text-white"
                style={{ background: wallet.color }}
              >
                {wallet.abbr}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-xs font-medium",
                  activeWallet === wallet.name
                    ? "text-accent"
                    : "text-primary",
                )}
              >
                {wallet.name}
              </span>
              {activeWallet === wallet.name ? (
                <CupertinoIcon name="check" className="size-3.5 text-accent" />
              ) : null}
            </button>
          ))}

          <div className="my-1 h-px bg-surface/50 dark:bg-white/8" />

          <button
            className="flex w-full items-center gap-2.5 rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left transition-colors hover:bg-surface/40 dark:hover:bg-white/8"
            onClick={() => {
              setIsOpen(false);
              onAddWallet();
            }}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-dashed border-strong">
              <CupertinoIcon name="plus" className="size-3.5 text-tertiary dark:text-secondary" />
            </span>
            <span className="text-xs text-tertiary dark:text-secondary">Add wallet</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AddWalletDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { addWallet } = useWallets();
  const [walletDraft, setWalletDraft] = useState({
    name: "",
    institution: "",
    balance: "",
    color: walletColorOptions[0].color,
    tone: walletColorOptions[0].tone,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="liquid-modal w-full max-w-95 rounded-[18px] p-4"
      >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          addWallet({
            name: walletDraft.name,
            institution: walletDraft.institution,
            balance: Number(walletDraft.balance.replace(/[^\d.-]/g, "")),
            color: walletDraft.color,
            tone: walletDraft.tone,
          });
          setWalletDraft({
            name: "",
            institution: "",
            balance: "",
            color: walletColorOptions[0].color,
            tone: walletColorOptions[0].tone,
          });
          onOpenChange(false);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-tertiary">Wallet</p>
            <h2 className="text-[15px] font-semibold text-primary">Add wallet</h2>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full bg-black/6 dark:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            <CupertinoIcon name="close" className="size-3.5 text-secondary" />
          </button>
        </div>

        <div className="space-y-2.5">
          <label className="block rounded-[12px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-[rgb(255_255_255/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] text-secondary">
              <CupertinoIcon name="wallet" className="size-3" />
              Wallet name
            </span>
            <input
              value={walletDraft.name}
              onChange={(event) =>
                setWalletDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="e.g. BCA Everyday"
              className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
            />
          </label>
          <label className="block rounded-[12px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-[rgb(255_255_255/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <span className="mb-1.5 block text-[11px] text-secondary">
              Institution
            </span>
            <input
              value={walletDraft.institution}
              onChange={(event) =>
                setWalletDraft((current) => ({
                  ...current,
                  institution: event.target.value,
                }))
              }
              placeholder="Bank or wallet provider"
              className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
            />
          </label>
          <label className="block rounded-[12px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-[rgb(255_255_255/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <span className="mb-1.5 block text-[11px] text-secondary">
              Current balance
            </span>
            <input
              value={walletDraft.balance}
              onChange={(event) =>
                setWalletDraft((current) => ({
                  ...current,
                  balance: event.target.value,
                }))
              }
              inputMode="numeric"
              placeholder="18500000"
              className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
            />
          </label>
          <div className="rounded-[12px] bg-white px-4 py-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] dark:bg-[rgb(255_255_255/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
            <span className="mb-2 block text-[11px] text-secondary">
              Wallet color
            </span>
            <div className="grid grid-cols-6 gap-2">
              {walletColorOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[8px] ring-offset-2 ring-offset-white/50 dark:ring-offset-white/7",
                    walletDraft.color === option.color && "ring-2 ring-[var(--accent)]",
                  )}
                  style={{ background: option.color }}
                  onClick={() =>
                    setWalletDraft((current) => ({
                      ...current,
                      color: option.color,
                      tone: option.tone,
                    }))
                  }
                  aria-label={option.name}
                >
                  {walletDraft.color === option.color ? (
                    <span className="size-2 rounded-full bg-surface" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-[10px] border-strong bg-white/50 dark:bg-white/7 dark:text-primary shadow-none dark:hover:bg-white/12"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <WorkspacePrimaryButton
            type="submit"
            className="rounded-[10px]"
          >
            Add wallet
          </WorkspacePrimaryButton>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
}
