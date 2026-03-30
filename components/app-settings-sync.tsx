"use client";

import { useEffect } from "react";

import { useAppSettings } from "@/hooks/use-app-settings";

export function AppSettingsSync() {
  const { settings } = useAppSettings();

  useEffect(() => {
    document.documentElement.dataset.density = settings.displayDensity;
  }, [settings.displayDensity]);

  return null;
}
