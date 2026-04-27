import { CupertinoIcon, type CupertinoIconName } from "@/components/icons/cupertino-icon";
import { WorkspaceSection } from "@/components/ui/workspace-section";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  title: string;
  value: string | number;
  description?: string;
  detail?: string;
  trend?: string | null;
  icon?: CupertinoIconName;
  iconBg?: string;
  iconColor?: string;
  valueClassName?: string;
  trendClassName?: string;
  className?: string;
};

export function SummaryCard({
  title,
  value,
  description,
  detail,
  trend,
  icon,
  iconBg,
  iconColor,
  valueClassName,
  trendClassName,
  className,
}: SummaryCardProps) {
  return (
    <WorkspaceSection
      as="div"
      className={cn("flex flex-col border border-black/4 dark:border-white/5 p-4.5", className)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium tracking-[0.02em] text-tertiary">
          {title}
        </p>
        {icon ? (
          <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", iconBg ?? "bg-surface-muted")}>
            <CupertinoIcon name={icon} className={cn("size-3.5", iconColor ?? "text-secondary")} />
          </span>
        ) : null}
      </div>

      <p className={cn("mt-2.5 text-[24px] font-semibold tracking-[-0.03em] text-primary", valueClassName)}>
        {value}
      </p>

      {description ? (
        <p className="mt-2 text-[11px] leading-5 text-tertiary">{description}</p>
      ) : null}

      {detail || trend ? (
        <div className="mt-auto border-t border-subtle pt-3 flex items-center gap-1.5 text-[11px]" style={{ marginTop: description ? undefined : "auto" }}>
          {trend ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold",
                trendClassName,
              )}
            >
              {trend}
            </span>
          ) : null}
          {detail ? <span className="truncate text-tertiary">{detail}</span> : null}
        </div>
      ) : null}
    </WorkspaceSection>
  );
}
