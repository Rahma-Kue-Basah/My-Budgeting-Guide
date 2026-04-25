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
  valueClassName,
  trendClassName,
  className,
}: SummaryCardProps) {
  return (
    <WorkspaceSection as="div" className={cn("p-[18px]", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-medium tracking-[0.02em] text-tertiary">
            {title}
          </p>
          <p className={cn("text-[24px] font-semibold tracking-[-0.03em] text-primary", valueClassName)}>
            {value}
          </p>
        </div>
        {icon ? (
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-surface-raised">
            <CupertinoIcon name={icon} className="size-4 text-secondary" />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-3 text-[11px] leading-5 text-tertiary">{description}</p>
      ) : null}
      {detail || trend ? (
        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
          {trend ? (
            <span className={cn("font-semibold", trendClassName)}>{trend}</span>
          ) : null}
          {detail ? <span className="truncate text-tertiary">{detail}</span> : null}
        </div>
      ) : null}
    </WorkspaceSection>
  );
}
