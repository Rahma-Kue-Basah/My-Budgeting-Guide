"use client";

import { useEffect, useState } from "react";

const APP_SETTINGS_STORAGE_KEY = "nidhi-app-settings-v1";
const APP_SETTINGS_EVENT = "nidhi-app-settings-updated";

export type ParserMode = "balanced" | "strict";
export type DisplayDensity = "comfortable" | "compact";

export type AppSettings = {
  defaultBank: string;
  parserMode: ParserMode;
  displayDensity: DisplayDensity;
};

export const defaultAppSettings: AppSettings = {
  defaultBank: "bca",
  parserMode: "balanced",
  displayDensity: "comfortable",
};

function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return defaultAppSettings;
  }

  const input = value as Partial<AppSettings>;

  return {
    defaultBank:
      typeof input.defaultBank === "string" ? input.defaultBank : "bca",
    parserMode:
      input.parserMode === "strict" || input.parserMode === "balanced"
        ? input.parserMode
        : "balanced",
    displayDensity:
      input.displayDensity === "compact" ||
      input.displayDensity === "comfortable"
        ? input.displayDensity
        : "comfortable",
  };
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultAppSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
      if (raw) {
        setSettings(normalizeAppSettings(JSON.parse(raw)));
      }
    } catch {
      window.localStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    function handleSettingsChange(event: Event) {
      const nextSettings = (event as CustomEvent<AppSettings>).detail;

      if (nextSettings) {
        setSettings(normalizeAppSettings(nextSettings));
      }
    }

    window.addEventListener(APP_SETTINGS_EVENT, handleSettingsChange);

    return () => {
      window.removeEventListener(APP_SETTINGS_EVENT, handleSettingsChange);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [isHydrated, settings]);

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((current) => {
      const nextSettings = {
        ...current,
        ...patch,
      };

      window.dispatchEvent(
        new CustomEvent(APP_SETTINGS_EVENT, {
          detail: nextSettings,
        }),
      );

      return nextSettings;
    });
  }

  function resetSettings() {
    setSettings(defaultAppSettings);
    window.dispatchEvent(
      new CustomEvent(APP_SETTINGS_EVENT, {
        detail: defaultAppSettings,
      }),
    );
    window.localStorage.removeItem(APP_SETTINGS_STORAGE_KEY);
  }

  return {
    settings,
    isHydrated,
    updateSettings,
    resetSettings,
  };
}
