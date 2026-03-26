"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { parseBcaMutationPdf } from "@/lib/pdf-parser";
import { DASHBOARD_STORAGE_KEY, emptyDashboardState } from "@/lib/storage";
import {
  createUploadedFileRecord,
  filterTransactions,
  mergeTransactions,
  mergeUploadedFiles,
  summarizeTransactions,
} from "@/lib/transactions";
import type { DashboardFilters, StoredDashboardState } from "@/types/transaction";

const initialFilters: DashboardFilters = {
  search: "",
  type: "all",
  startDate: "",
  endDate: "",
};

export function useDashboardState() {
  const { isHydrated, setState: setStoredState, state: storedState } =
    useLocalStorageState<StoredDashboardState>(
      DASHBOARD_STORAGE_KEY,
      emptyDashboardState
    );
  const [filters, setFilters] = useState<DashboardFilters>(initialFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const [isParsing, setIsParsing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  const effectiveFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(storedState.transactions, effectiveFilters),
    [effectiveFilters, storedState.transactions]
  );

  const summary = useMemo(
    () => summarizeTransactions(storedState.transactions, storedState.uploadedFiles),
    [storedState.transactions, storedState.uploadedFiles]
  );

  async function handleFilesSelected(files: File[]) {
    setIsParsing(true);
    setErrorMessage(null);
    setWarnings([]);

    try {
      const results = await Promise.all(
        files.map(async (file) => ({
          file,
          parsedResult: await parseBcaMutationPdf(file),
        }))
      );

      let nextTransactions = storedState.transactions;
      let nextFiles = storedState.uploadedFiles;
      const nextWarnings: string[] = [];

      for (const { file, parsedResult } of results) {
        nextTransactions = mergeTransactions(
          nextTransactions,
          parsedResult.transactions
        );
        nextFiles = mergeUploadedFiles(
          nextFiles,
          createUploadedFileRecord(file.name, parsedResult.transactions.length)
        );
        nextWarnings.push(...parsedResult.warnings);
      }

      setWarnings(nextWarnings);
      setStoredState({
        lastUpdatedAt: new Date().toISOString(),
        transactions: nextTransactions,
        uploadedFiles: nextFiles,
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Terjadi error saat memproses PDF."
      );
    } finally {
      setIsParsing(false);
    }
  }

  function resetAllData() {
    setFilters(initialFilters);
    setWarnings([]);
    setErrorMessage(null);
    setStoredState(emptyDashboardState);
  }

  return {
    errorMessage,
    filteredTransactions,
    filters,
    handleFilesSelected,
    initialFilters,
    isHydrated,
    isParsing,
    resetAllData,
    setFilters,
    storedState,
    summary,
    warnings,
  };
}
