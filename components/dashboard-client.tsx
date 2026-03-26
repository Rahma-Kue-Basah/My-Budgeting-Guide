"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { FileHistory } from "@/components/file-history";
import { SummaryCards } from "@/components/summary-cards";
import { TransactionFilters } from "@/components/transaction-filters";
import { TransactionTable } from "@/components/transaction-table";
import { UploadDropzone } from "@/components/upload-dropzone";
import { useLocalStorageState } from "@/hooks/use-local-storage-state";
import { exportSummaryCsv, exportTransactionsCsv } from "@/lib/export";
import { parseBcaMutationPdf } from "@/lib/pdf-parser";
import { emptyDashboardState, DASHBOARD_STORAGE_KEY } from "@/lib/storage";
import {
  createUploadedFileRecord,
  filterTransactions,
  mergeTransactions,
  mergeUploadedFiles,
  summarizeTransactions,
} from "@/lib/transactions";
import type { DashboardFilters, StoredDashboardState } from "@/types/transaction";

const initialFilters: DashboardFilters = {
  endDate: "",
  search: "",
  startDate: "",
  type: "all",
};

export function DashboardClient() {
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
        files.map(async (file) => {
          const parsedResult = await parseBcaMutationPdf(file);

          return {
            file,
            parsedResult,
          };
        })
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
      const message =
        error instanceof Error
          ? error.message
          : "Terjadi error saat memproses PDF.";
      setErrorMessage(message);
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

  if (!isHydrated) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-6 py-16">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white px-8 py-6 text-sm text-slate-600 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.4)]">
          Menyiapkan dashboard lokal...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_36%),linear-gradient(135deg,_#ffffff,_#f8fafc_55%,_#eefcf5)] p-8 shadow-[0_36px_120px_-72px_rgba(15,23,42,0.65)]">
        <div className="max-w-3xl">
          <p className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white w-fit">
            BCA Mutation Tracker
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            PDF mutasi BCA menjadi dashboard interaktif tanpa backend
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Upload PDF mutasi rekening, ekstrak transaksi langsung di browser,
            gabungkan file tambahan, filter hasil, lalu export ke CSV tanpa
            menyimpan data ke server.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => exportTransactionsCsv(filteredTransactions)}
            disabled={storedState.transactions.length === 0}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV transaksi
          </button>
          <button
            type="button"
            onClick={() => exportSummaryCsv(summary)}
            disabled={storedState.transactions.length === 0}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export ringkasan
          </button>
          <button
            type="button"
            onClick={resetAllData}
            disabled={storedState.transactions.length === 0 && storedState.uploadedFiles.length === 0}
            className="rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset semua data
          </button>
        </div>
      </section>

      <UploadDropzone disabled={isParsing} onFilesSelected={handleFilesSelected} />

      {isParsing ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          Memproses PDF dan membaca transaksi. Lama proses tergantung jumlah halaman dan kualitas teks PDF.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {errorMessage}
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {storedState.transactions.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-slate-300 bg-white/80 px-8 py-14 text-center shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)]">
          <h2 className="text-2xl font-semibold text-slate-950">
            Belum ada data mutasi
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Upload satu atau beberapa file PDF mutasi BCA. Jika PDF berupa scan
            gambar tanpa layer teks, parser client-side mungkin tidak bisa
            membaca transaksi dan akan menampilkan warning.
          </p>
        </section>
      ) : (
        <>
          <SummaryCards summary={summary} />
          <TransactionFilters
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(initialFilters)}
          />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <TransactionTable transactions={filteredTransactions} />
            <FileHistory files={storedState.uploadedFiles} />
          </div>
        </>
      )}
    </main>
  );
}
