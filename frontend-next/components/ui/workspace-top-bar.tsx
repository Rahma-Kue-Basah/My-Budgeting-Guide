"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type WorkspaceTopBarProps = {
  title: ReactNode;
  actions?: ReactNode;
  variant?: "sticky" | "fixed";
  className?: string;
  contentClassName?: string;
};

export function WorkspaceTopBar({
  title,
  actions,
  variant = "sticky",
  className,
  contentClassName,
}: WorkspaceTopBarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section
      className={cn(
        "relative transition-[background-color,border-color,backdrop-filter] duration-200",
        scrolled
          ? "liquid-topbar border-b border-white/60 dark:border-white/8"
          : "border-b border-transparent bg-transparent",
        variant === "fixed"
          ? "fixed top-[58px] right-0 left-0 z-20 md:top-0 md:left-58 md:w-[calc(100%-232px)]"
          : "sticky top-[58px] z-10 md:top-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2.5",
          variant === "fixed" && "h-[58px] py-0",
          contentClassName,
        )}
      >
        <div className="min-w-0">
          {typeof title === "string" ? (
            <h1 className="truncate text-xl font-semibold tracking-normal text-primary">
              {title}
            </h1>
          ) : (
            title
          )}
        </div>
        {actions ? (
          <div className="ml-auto hidden flex-wrap items-center gap-2 sm:flex">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
