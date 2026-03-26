import { Palette, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Area placeholder untuk preferensi workspace dan konfigurasi produk."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[24px] border-white/70 bg-white/85">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <Palette className="size-5" />
            </div>
            <CardTitle className="mt-4">Workspace appearance</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-500">
            Opsi tema, density tabel, dan preferensi tampilan dashboard bisa
            ditempatkan di sini ketika UI masuk tahap integrasi penuh.
          </CardContent>
        </Card>
        <Card className="rounded-[24px] border-white/70 bg-white/85">
          <CardHeader>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <ShieldCheck className="size-5" />
            </div>
            <CardTitle className="mt-4">Processing preferences</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-slate-500">
            Nantinya halaman ini dapat dipakai untuk mengatur format parser,
            deduplication policy, dan opsi export sesuai kebutuhan operasional.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
