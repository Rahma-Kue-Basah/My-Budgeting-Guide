"use client";

import { useState } from "react";

import { CupertinoIcon } from "@/components/icons/cupertino-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WorkspaceSection } from "@/components/ui/workspace-section";
import { WorkspaceTopBar } from "@/components/ui/workspace-top-bar";
import {
  AddWalletTopBarButton,
  AddWalletDialog,
  type Wallet,
  useWallets,
} from "@/features/wallets/wallets";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function WalletCard({
  name,
  institution,
  balance,
  abbr,
  color,
  isActive,
  onSetActive,
  onEdit,
  onDelete,
  variant = "default",
}: {
  name: string;
  institution: string;
  balance: number;
  abbr: string;
  color: string;
  isActive: boolean;
  onSetActive: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  variant?: "default" | "all";
}) {
  const isAllWallet = variant === "all";

  return (
    <WorkspaceSection
      as="div"
      padded={false}
      className={cn(
        "group p-3.5 text-left transition-all",
        "hover:border-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] hover:shadow-[0_12px_32px_rgba(15,23,42,0.035)]",
        isAllWallet &&
          "bg-[#0f3ea8] text-white shadow-[0_18px_34px_rgba(15,62,168,0.18)] hover:bg-[#103b98]",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2.5">
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-[9px] text-[12px] font-bold tracking-[0.08em] text-white",
              isAllWallet && "bg-white/14",
            )}
            style={isAllWallet ? undefined : { background: color }}
          >
            {isAllWallet ? (
              <CupertinoIcon name="wallet" className="size-3.5 text-white" />
            ) : (
              abbr
            )}
          </span>
          <div>
            <p
              className={cn(
                "text-[10px] font-medium uppercase tracking-[0.1em] text-tertiary",
                isAllWallet && "text-white/72",
              )}
            >
              {institution}
            </p>
            <h2
              className={cn(
                "mt-0.5 text-[14px] font-semibold tracking-[-0.02em] text-primary",
                isAllWallet && "text-white",
              )}
            >
              {name}
            </h2>
          </div>
        </div>

        {isActive ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.75 text-[10px] font-medium",
              isAllWallet
                ? "bg-white/12 text-white"
                : "bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-accent",
            )}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: isAllWallet ? "white" : "var(--accent)" }}
            />
            Aktif
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 flex items-end justify-between gap-2.5 border-t border-subtle pt-3",
          isAllWallet && "border-white/12",
        )}
      >
        <p
          className={cn(
            "text-[20px] font-semibold tracking-[-0.04em] text-primary",
            isAllWallet && "text-white",
          )}
        >
          {formatCurrency(balance)}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                aria-label={`Aksi untuk wallet ${name}`}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted/80 text-tertiary transition-colors hover:bg-surface-muted",
                  isAllWallet && "bg-white/10 text-white/72 hover:bg-white/14",
                )}
              />
            }
          >
            <CupertinoIcon name="more" className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-48 rounded-[12px] border border-subtle bg-surface p-1 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ring-0 dark:shadow-[0_18px_38px_rgba(0,0,0,0.28)]"
          >
            <DropdownMenuItem
              onClick={onSetActive}
              className="min-h-9 rounded-[10px] px-2.5 text-[12px] font-medium text-primary focus:bg-surface-muted focus:text-primary"
            >
              <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-muted text-accent">
                <CupertinoIcon name="check" className="size-4" />
              </span>
              {isAllWallet ? "Set semua wallet aktif" : "Set wallet aktif"}
            </DropdownMenuItem>
            {!isAllWallet ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onEdit}
                  className="min-h-9 rounded-[10px] px-2.5 text-[12px] font-medium text-primary focus:bg-surface-muted focus:text-primary"
                >
                  <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-muted text-secondary">
                    <CupertinoIcon name="list" className="size-4" />
                  </span>
                  Edit wallet
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="min-h-9 rounded-[10px] px-2.5 text-[12px] font-medium text-primary focus:bg-surface-muted focus:text-primary"
                >
                  <span className="flex size-7 items-center justify-center rounded-[8px] bg-surface-muted text-danger">
                    <CupertinoIcon name="close" className="size-4" />
                  </span>
                  Hapus wallet
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </WorkspaceSection>
  );
}

export function WalletsWorkspace() {
  const { wallets, activeWallet, setActiveWallet, removeWallet } = useWallets();
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [walletDialogMode, setWalletDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <>
      <WorkspaceTopBar
        title="Wallet"
        variant="fixed"
        actions={
          <AddWalletTopBarButton
            onClick={() => {
              setWalletDialogMode("create");
              setEditingWallet(null);
              setIsWalletDialogOpen(true);
            }}
          />
        }
      />

      <main className="min-h-svh w-full overflow-x-hidden bg-app text-primary">
        <div className="flex w-full flex-col gap-4 px-3 pt-[60px] pb-4">
          <section>
            

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <WalletCard
                name="All Wallets"
                institution={`${wallets.length} wallet tersimpan`}
                balance={totalBalance}
                abbr="AW"
                color="var(--accent)"
                isActive={activeWallet === "all"}
                onSetActive={() => setActiveWallet("all")}
                variant="all"
              />

              {wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  name={wallet.name}
                  institution={wallet.institution}
                  balance={wallet.balance}
                  abbr={wallet.abbr}
                  color={wallet.color}
                  isActive={activeWallet === wallet.name}
                  onSetActive={() => setActiveWallet(wallet.name)}
                  onEdit={() => {
                    setWalletDialogMode("edit");
                    setEditingWallet(wallet);
                    setIsWalletDialogOpen(true);
                  }}
                  onDelete={() => removeWallet(wallet.id)}
                />
              ))}

              <WorkspaceSection
                as="button"
                padded={false}
                type="button"
                onClick={() => {
                  setWalletDialogMode("create");
                  setEditingWallet(null);
                  setIsWalletDialogOpen(true);
                }}
                className="flex min-h-[164px] flex-col items-center justify-center border-dashed bg-surface p-3.5 text-center transition-colors hover:bg-surface-muted/20 dark:bg-white/6 dark:hover:bg-white/10"
              >
                <span className="flex size-10 items-center justify-center rounded-[10px] bg-surface shadow-[inset_0_0_0_1px_rgb(0_0_0/0.04)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                  <CupertinoIcon name="plus" className="size-5 text-primary" />
                </span>
                <h3 className="mt-2.5 text-[13px] font-semibold text-primary">
                  Tambah Wallet
                </h3>
              </WorkspaceSection>
            </div>
          </section>
        </div>
      </main>

      <AddWalletDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
        mode={walletDialogMode}
        wallet={editingWallet}
      />
    </>
  );
}
