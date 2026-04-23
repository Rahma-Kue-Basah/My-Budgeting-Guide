"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function FilterCard({
  children,
  description,
  defaultOpen = false,
}: {
  children: React.ReactNode;
  description?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <CardTitle>Filters</CardTitle>
            </div>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={open ? "Collapse filters" : "Expand filters"}
            onClick={() => setOpen((current) => !current)}
          >
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </Button>
        </div>
      </CardHeader>
      {open ? <CardContent className="space-y-4">{children}</CardContent> : null}
    </Card>
  );
}
