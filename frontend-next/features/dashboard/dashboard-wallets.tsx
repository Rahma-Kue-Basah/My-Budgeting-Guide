"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type WalletTone = "blue" | "green" | "orange" | "slate";

export type DashboardWallet = {
  id: string;
  name: string;
  institution: string;
  balance: number;
  tone: WalletTone;
  abbr: string;
  color: string;
};

const WALLETS_STORAGE_KEY = "mbg_dashboard_wallets";
const ACTIVE_WALLET_STORAGE_KEY = "mbg_dashboard_active_wallet";
const WALLET_CHANGE_EVENT = "mbg-dashboard-wallets-change";

const walletColorOptions = [
  { name: "Blue", tone: "blue" as const, color: "#007aff" },
  { name: "Green", tone: "green" as const, color: "#30d158" },
  { name: "Orange", tone: "orange" as const, color: "#ff9f0a" },
  { name: "Graphite", tone: "slate" as const, color: "#1c1c1e" },
  { name: "BCA", tone: "blue" as const, color: "#1155cc" },
  { name: "Gold", tone: "orange" as const, color: "#b8860b" },
];

export const defaultDashboardWallets: DashboardWallet[] = [
  {
    id: "wallet-bca",
    name: "BCA",
    institution: "Bank Central Asia",
    balance: 18450000,
    tone: "blue",
    abbr: "BK",
    color: "#1155cc",
  },
  {
    id: "wallet-mandiri",
    name: "Mandiri",
    institution: "Bank Mandiri",
    balance: 5230000,
    tone: "orange",
    abbr: "MD",
    color: "#e8a900",
  },
  {
    id: "wallet-chase",
    name: "Chase Sapphire",
    institution: "Credit card",
    balance: 1260000,
    tone: "slate",
    abbr: "CH",
    color: "#0a2e6b",
  },
  {
    id: "wallet-amex",
    name: "Amex Gold",
    institution: "Credit card",
    balance: 3120000,
    tone: "orange",
    abbr: "AM",
    color: "#b8860b",
  },
];

function normalizeWallet(value: unknown): DashboardWallet | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const wallet = value as Partial<DashboardWallet>;
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
    color: wallet.color || "#636366",
  };
}

function loadWallets() {
  if (typeof window === "undefined") {
    return defaultDashboardWallets;
  }

  try {
    const raw = window.localStorage.getItem(WALLETS_STORAGE_KEY);
    if (!raw) {
      return defaultDashboardWallets;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return defaultDashboardWallets;
    }

    const normalized = parsed
      .map(normalizeWallet)
      .filter((wallet): wallet is DashboardWallet => Boolean(wallet));

    return normalized.length > 0 ? normalized : defaultDashboardWallets;
  } catch {
    return defaultDashboardWallets;
  }
}

function loadActiveWallet() {
  if (typeof window === "undefined") {
    return "all";
  }

  return window.localStorage.getItem(ACTIVE_WALLET_STORAGE_KEY) || "all";
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
    wallets: defaultDashboardWallets,
    activeWallet: "all",
  });
}

export function useDashboardWallets() {
  const snapshot = useSyncExternalStore(
    subscribeToWallets,
    getWalletSnapshot,
    getServerWalletSnapshot,
  );

  const { wallets, activeWallet } = useMemo(
    () =>
      JSON.parse(snapshot) as {
        wallets: DashboardWallet[];
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
    const nextWallet: DashboardWallet = {
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
        tone === "blue" && "bg-[#007aff]",
        tone === "green" && "bg-[#30d158]",
        tone === "orange" && "bg-[#ff9f0a]",
        tone === "slate" && "bg-[#1c1c1e]",
      )}
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
  const { wallets, activeWallet, setActiveWallet } = useDashboardWallets();
  const [isOpen, setIsOpen] = useState(false);
  const selectedWallet =
    activeWallet === "all"
      ? null
      : wallets.find((wallet) => wallet.name === activeWallet) ?? null;
  const selectedLabel = selectedWallet?.name ?? "All Wallets";

  return (
    <div className={cn("relative", className)}>
      <div className="pb-[3px] text-[10px] font-semibold tracking-[0.07em] text-[#aeaeb2] uppercase">
        <span className="text-[10px] font-semibold tracking-[0.07em] text-[#aeaeb2] uppercase">
          Wallets
        </span>
      </div>

      <button
        className={cn(
          "mb-px flex h-[36px] w-full items-center gap-[9px] rounded-[8px] border-0 px-2.5 text-left",
          "bg-[#f2f2f4] hover:bg-black/[0.06]",
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
          <span className="flex size-5 shrink-0 items-center justify-center rounded-[6px] bg-[#007aff]">
            <CupertinoIcon name="wallet" className="size-3 text-white" />
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-[#1c1c1e]">
          {selectedLabel}
        </span>
        {iconEnd ? <span className="ml-auto flex size-3.5 items-center">{iconEnd}</span> : null}
      </button>

      {isOpen ? (
        <div className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 rounded-[10px] border border-black/[0.06] bg-white p-1 shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
          <button
            className={cn(
              "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left",
              activeWallet === "all"
                ? "bg-[#007aff]/10"
                : "hover:bg-black/[0.03]",
            )}
            onClick={() => {
              setActiveWallet("all");
              setIsOpen(false);
            }}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] bg-[#007aff]">
              <CupertinoIcon name="wallet" className="size-3.5 text-white" />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-xs font-medium",
                activeWallet === "all" ? "text-[#007aff]" : "text-[#1c1c1e]",
              )}
            >
              All Wallets
            </span>
            {activeWallet === "all" ? (
              <CupertinoIcon name="check" className="size-3.5 text-[#007aff]" />
            ) : null}
          </button>

          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[8px] border-0 px-2 py-1.5 text-left",
                activeWallet === wallet.name
                  ? "bg-[#007aff]/10"
                  : "hover:bg-black/[0.03]",
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
                    ? "text-[#007aff]"
                    : "text-[#1c1c1e]",
                )}
              >
                {wallet.name}
              </span>
              {activeWallet === wallet.name ? (
                <CupertinoIcon name="check" className="size-3.5 text-[#007aff]" />
              ) : null}
            </button>
          ))}

          <div className="my-1 h-px bg-black/[0.06]" />

          <button
            className="flex w-full items-center gap-2.5 rounded-[8px] border-0 bg-transparent px-2 py-1.5 text-left hover:bg-black/[0.03]"
            onClick={() => {
              setIsOpen(false);
              onAddWallet();
            }}
            type="button"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-dashed border-black/20">
              <CupertinoIcon name="plus" className="size-3.5 text-[#aeaeb2]" />
            </span>
            <span className="text-xs text-[#aeaeb2]">Add wallet</span>
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
  const { addWallet } = useDashboardWallets();
  const [walletDraft, setWalletDraft] = useState({
    name: "",
    institution: "",
    balance: "",
    color: walletColorOptions[0].color,
    tone: walletColorOptions[0].tone,
  });

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={() => onOpenChange(false)}
    >
      <form
        className="w-full max-w-[380px] rounded-[18px] bg-[#f2f2f4] p-4 shadow-[0_32px_100px_rgba(0,0,0,0.2)]"
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
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[#8e8e93]">Wallet</p>
            <h2 className="text-[15px] font-semibold">Add wallet</h2>
          </div>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full bg-black/10"
            onClick={() => onOpenChange(false)}
          >
            <CupertinoIcon name="close" className="size-3.5 text-[#636366]" />
          </button>
        </div>

        <div className="space-y-2.5">
          <label className="block rounded-[12px] bg-white px-4 py-3">
            <span className="mb-1.5 flex items-center gap-1.5 text-[11px] text-[#636366]">
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
              className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-[#c7c7cc]"
            />
          </label>
          <label className="block rounded-[12px] bg-white px-4 py-3">
            <span className="mb-1.5 block text-[11px] text-[#636366]">
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
              className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-[#c7c7cc]"
            />
          </label>
          <label className="block rounded-[12px] bg-white px-4 py-3">
            <span className="mb-1.5 block text-[11px] text-[#636366]">
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
              className="w-full border-0 bg-transparent text-sm font-medium outline-none placeholder:text-[#c7c7cc]"
            />
          </label>
          <div className="rounded-[12px] bg-white px-4 py-3">
            <span className="mb-2 block text-[11px] text-[#636366]">
              Wallet color
            </span>
            <div className="grid grid-cols-6 gap-2">
              {walletColorOptions.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  className={cn(
                    "flex size-8 items-center justify-center rounded-[8px] ring-offset-2 ring-offset-white",
                    walletDraft.color === option.color && "ring-2 ring-[#007aff]",
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
                    <span className="size-2 rounded-full bg-white" />
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
            className="rounded-[10px] border-black/10 bg-white shadow-none"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="rounded-[10px] bg-[#1c1c1e] text-white shadow-none hover:bg-black"
          >
            Add wallet
          </Button>
        </div>
      </form>
    </div>
  );
}
