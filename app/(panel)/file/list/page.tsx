"use client";

import { FileList } from "@/components/file/file-list";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useDashboardState } from "@/hooks/use-dashboard-state";

export default function FileListPage() {
  const { isHydrated, storedState } = useDashboardState();

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Menyiapkan data...
      </div>
    );
  }

  return (
    <AppShell
      title="List File"
      subtitle="Riwayat file mutasi yang pernah masuk ke workspace."
      actions={
        <Button className="h-11 rounded-2xl bg-[linear-gradient(135deg,#7c3aed,#2563eb)] px-5 text-white shadow-[0_16px_30px_rgba(79,70,229,0.24)]">
          Upload batch baru
        </Button>
      }
    >
      <FileList files={storedState.uploadedFiles} />
    </AppShell>
  );
}
