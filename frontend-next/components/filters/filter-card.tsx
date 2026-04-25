"use client";

import type { ReactNode } from "react";

import { CollapsibleFilterPanel } from "@/components/filters/collapsible-filter-panel";

export function FilterCard({
  children,
  description,
  defaultOpen = false,
}: {
  children: ReactNode;
  description?: string;
  defaultOpen?: boolean;
}) {
  return (
    <CollapsibleFilterPanel
      title="Filters"
      description={description}
      defaultOpen={defaultOpen}
    >
      {children}
    </CollapsibleFilterPanel>
  );
}
