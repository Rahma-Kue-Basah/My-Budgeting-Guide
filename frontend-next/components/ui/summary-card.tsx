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
  titleClassName?: string;
  detailClassName?: string;
  trendContainerClassName?: string;
  chevronClassName?: string;
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
  titleClassName,
  detailClassName,
  trendContainerClassName,
  chevronClassName,
  className,
}: SummaryCardProps) {
  return (
    <WorkspaceSection
      as="div"
      className={cn("flex gap-3 border-subtle p-4.5", className)}
    >
      {icon ? (
        <span
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl",
            iconBg ?? "bg-surface-muted",
          )}
        >
          <CupertinoIcon
            name={icon}
            className={cn("size-5", iconColor ?? "text-secondary")}
          />
        </span>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-[11px] font-medium tracking-[0.02em] text-tertiary",
              titleClassName,
            )}
          >
            {title}
          </p>
          <span
            className={cn(
              "flex size-5 shrink-0 items-center justify-center text-tertiary",
              chevronClassName,
            )}
          >
            <CupertinoIcon
              name="chevronDown"
              className="size-3.5 -rotate-90"
            />
          </span>
        </div>

        <p
          className={cn(
            "my-2 text-[24px] font-semibold tracking-[-0.03em] text-primary",
            valueClassName,
          )}
        >
          {value}
        </p>

        {description ? (
          <p className="mt-2 text-[11px] leading-5 text-tertiary">{description}</p>
        ) : null}

        {detail || trend ? (
          <div
            className={cn(
              "mt-auto flex items-center gap-1.5 border-t border-subtle pt-3 text-[11px]",
              trendContainerClassName,
            )}
            style={{ marginTop: description ? undefined : "auto" }}
          >
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
            {detail ? (
              <span className={cn("truncate text-tertiary", detailClassName)}>
                {detail}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </WorkspaceSection>
  );
}
