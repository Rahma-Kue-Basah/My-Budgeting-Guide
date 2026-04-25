"use client";

import { useEffect } from "react";

import { useAppSettings, type AppTheme } from "@/hooks/use-app-settings";

function applyTheme(theme: AppTheme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", isDark);
}

export function AppSettingsSync() {
  const { settings } = useAppSettings();

  useEffect(() => {
    document.documentElement.dataset.density = settings.displayDensity;
  }, [settings.displayDensity]);

  useEffect(() => {
    applyTheme(settings.theme);

    if (settings.theme !== "system") {
      return;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function handleSystemChange(event: MediaQueryListEvent) {
      document.documentElement.classList.toggle("dark", event.matches);
    }

    mq.addEventListener("change", handleSystemChange);
    return () => mq.removeEventListener("change", handleSystemChange);
  }, [settings.theme]);

  return null;
}
