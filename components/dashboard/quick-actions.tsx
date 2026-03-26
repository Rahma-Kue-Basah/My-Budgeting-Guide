import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { quickActions } from "@/lib/mock-dashboard";

export function QuickActions() {
  return (
    <Card className="rounded-[24px] border-white/70 bg-white/85">
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {quickActions.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,255,0.94))] p-4 transition-all hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_14px_30px_rgba(99,102,241,0.10)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              </div>
              <ArrowRight className="mt-0.5 size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
