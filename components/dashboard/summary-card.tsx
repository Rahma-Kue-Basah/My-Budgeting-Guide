import { ArrowUpRight, LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function SummaryCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="overflow-hidden rounded-[20px] border-border bg-white">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              {label}
            </p>
            <p className="mt-3 text-[1.75rem] font-semibold tracking-tight text-slate-950">
              {value}
            </p>
            <p className="mt-2 text-sm text-slate-500">{note}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-primary">
          <ArrowUpRight className="size-3.5" />
          Workspace insight
        </div>
      </CardContent>
    </Card>
  );
}
