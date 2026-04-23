"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  DEFAULT_CATEGORIES,
  mergeDefaultCategories,
  normalizeKeywords,
  reindexCategoryPriorities,
  sortCategoriesByPriority,
} from "@/lib/categories";
import { normalizeMerchantKey } from "@/lib/merchants";
import { parseBcaPdf, parseBcaStatementText } from "@/lib/pdf-parser";
import { FILE_WORKSPACE_STORAGE_KEY } from "@/lib/storage";
import type {
  BudgetPlan,
  CategoryColor,
  FileWorkspaceState,
  ImportActivity,
  MerchantMapping,
  ParsedPdfResult,
  ParsedTransaction,
  TransactionType,
  UploadedPdfFile,
  WorkspaceCategory,
} from "@/types/transaction";

const defaultState: FileWorkspaceState = {
  files: [],
  transactions: [],
  activities: [],
  categories: DEFAULT_CATEGORIES,
  merchantMappings: [],
  budgetPlans: [],
};

type FileWorkspaceBackup = {
  version: 1;
  exportedAt: string;
  state: FileWorkspaceState;
};

function isMeaningfulTransaction(transaction: ParsedTransaction) {
  return !transaction.description.toUpperCase().includes("SALDO AWAL");
}

function dedupeTransactions(transactions: ParsedTransaction[]) {
  const map = new Map<string, ParsedTransaction>();

  for (const transaction of transactions.filter(isMeaningfulTransaction)) {
    const key = [
      transaction.date,
      transaction.description,
      transaction.type,
      transaction.amount,
      transaction.balance ?? "none",
    ].join("|");

    if (!map.has(key)) {
      map.set(key, transaction);
    }
  }

  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

function mergeFiles(files: UploadedPdfFile[]) {
  const map = new Map(files.map((file) => [file.name, file]));
  return [...map.values()].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

function mergeActivities(activities: ImportActivity[]) {
  const map = new Map(activities.map((activity) => [activity.id, activity]));
  return [...map.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

function syncFilesWithTransactions(
  files: UploadedPdfFile[],
  transactions: ParsedTransaction[]
) {
  const countBySourceFile = new Map<string, number>();

  for (const transaction of transactions) {
    countBySourceFile.set(
      transaction.sourceFile,
      (countBySourceFile.get(transaction.sourceFile) ?? 0) + 1
    );
  }

  return files.map((file) => {
    const transactionCount = countBySourceFile.get(file.name) ?? 0;

    return {
      ...file,
      transactionCount,
      issueCount: transactionCount > 0 ? 0 : Math.max(file.issueCount, 1),
    };
  });
}

function isValidStatus(value: unknown): value is UploadedPdfFile["status"] {
  return value === "processed" || value === "review";
}

function isValidTone(value: unknown): value is ImportActivity["tone"] {
  return value === "success" || value === "warning";
}

function isValidCategoryColor(value: unknown): value is CategoryColor {
  return (
    value === "indigo" ||
    value === "sky" ||
    value === "emerald" ||
    value === "amber" ||
    value === "rose" ||
    value === "violet"
  );
}

function mergeMerchantMappings(mappings: MerchantMapping[]) {
  const map = new Map(mappings.map((mapping) => [mapping.merchantKey, mapping]));
  return [...map.values()].sort((a, b) =>
    a.merchantName.localeCompare(b.merchantName),
  );
}

function mergeBudgetPlans(plans: BudgetPlan[]) {
  const map = new Map(plans.map((plan) => [plan.month, plan]));
  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
}

function normalizeWorkspaceState(value: unknown): FileWorkspaceState {
  if (!value || typeof value !== "object") {
    return defaultState;
  }

  const input = value as Partial<FileWorkspaceState>;

  const files = Array.isArray(input.files)
    ? input.files.filter((file): file is UploadedPdfFile => {
        return (
          typeof file?.id === "string" &&
          typeof file?.name === "string" &&
          typeof file?.bank === "string" &&
          (file.rawText === undefined || typeof file.rawText === "string") &&
          typeof file?.size === "number" &&
          typeof file?.uploadedAt === "string" &&
          (file.statementPeriod === null ||
            file.statementPeriod === undefined ||
            typeof file.statementPeriod === "string") &&
          typeof file?.transactionCount === "number" &&
          isValidStatus(file?.status) &&
          typeof file?.issueCount === "number"
        );
      })
    : [];

  const transactions = Array.isArray(input.transactions)
    ? input.transactions.filter((transaction): transaction is ParsedTransaction => {
        return (
          typeof transaction?.id === "string" &&
          typeof transaction?.date === "string" &&
          typeof transaction?.description === "string" &&
          (transaction?.type === "debit" || transaction?.type === "credit") &&
          typeof transaction?.amount === "number" &&
          (transaction.balance === null || typeof transaction.balance === "number") &&
          typeof transaction?.sourceFile === "string" &&
          (transaction.categoryId === null ||
            transaction.categoryId === undefined ||
            typeof transaction.categoryId === "string")
        );
      })
        .map((transaction) => ({
          ...transaction,
          categoryId: transaction.categoryId ?? null,
        }))
        .filter(isMeaningfulTransaction)
    : [];

  const activities = Array.isArray(input.activities)
    ? input.activities.filter((activity): activity is ImportActivity => {
        return (
          typeof activity?.id === "string" &&
          typeof activity?.title === "string" &&
          typeof activity?.note === "string" &&
          typeof activity?.createdAt === "string" &&
          isValidTone(activity?.tone)
        );
      })
    : [];

  const categories = Array.isArray(input.categories)
    ? input.categories.filter((category): category is WorkspaceCategory => {
        return (
          typeof category?.id === "string" &&
          typeof category?.name === "string" &&
          isValidCategoryColor(category?.color) &&
          (category?.priority === undefined ||
            typeof category?.priority === "number") &&
          Array.isArray(category?.keywords) &&
          category.keywords.every((keyword) => typeof keyword === "string")
        );
      })
        .map((category) => ({
          ...category,
          priority: category.priority ?? 50,
        }))
    : DEFAULT_CATEGORIES;

  const merchantMappings = Array.isArray(input.merchantMappings)
    ? input.merchantMappings.filter((mapping): mapping is MerchantMapping => {
        return (
          typeof mapping?.id === "string" &&
          typeof mapping?.merchantKey === "string" &&
          typeof mapping?.merchantName === "string" &&
          (mapping?.categoryId === null || mapping?.categoryId === undefined || typeof mapping?.categoryId === "string") &&
          (mapping?.aliases === undefined ||
            (Array.isArray(mapping.aliases) &&
              mapping.aliases.every((alias) => typeof alias === "string")))
        );
      })
        .map((mapping) => ({
          ...mapping,
          merchantKey: normalizeMerchantKey(mapping.merchantKey),
          merchantName: mapping.merchantName.trim() || mapping.merchantKey,
          categoryId: mapping.categoryId ?? null,
          aliases: [...new Set((mapping.aliases ?? []).map(normalizeMerchantKey).filter(Boolean))],
        }))
    : [];

  const budgetPlans = Array.isArray(input.budgetPlans)
    ? input.budgetPlans
        .filter((plan): plan is BudgetPlan => {
          return (
            typeof plan?.id === "string" &&
            typeof plan?.month === "string" &&
            /^\d{4}-\d{2}$/.test(plan.month) &&
            typeof plan?.incomeTarget === "number" &&
            typeof plan?.expenseTarget === "number" &&
            typeof plan?.savingsTarget === "number" &&
            typeof plan?.createdAt === "string" &&
            typeof plan?.updatedAt === "string" &&
            Array.isArray(plan?.categoryPlans) &&
            plan.categoryPlans.every(
              (item) =>
                typeof item?.categoryId === "string" &&
                typeof item?.amount === "number",
            )
          );
        })
        .map((plan) => ({
          ...plan,
          categoryPlans: [...plan.categoryPlans]
            .filter((item) => item.amount >= 0)
            .sort((a, b) => b.amount - a.amount),
        }))
    : [];

  return {
    files: syncFilesWithTransactions(files, transactions),
    transactions: dedupeTransactions(transactions),
    activities: mergeActivities(activities),
    categories:
      categories.length > 0
        ? mergeDefaultCategories(categories)
        : DEFAULT_CATEGORIES,
    merchantMappings: mergeMerchantMappings(merchantMappings),
    budgetPlans: mergeBudgetPlans(budgetPlans),
  };
}

function buildProcessedWorkspaceState(state: FileWorkspaceState): FileWorkspaceState {
  const processedFileNames = new Set(
    state.files
      .filter((file) => file.status === "processed")
      .map((file) => file.name)
  );

  const files = state.files.filter((file) => file.status === "processed");
  const transactions = state.transactions.filter((transaction) =>
    processedFileNames.has(transaction.sourceFile)
  );
  const activities = state.activities.filter((activity) => {
    if (activity.tone === "success") {
      return true;
    }

    return [...processedFileNames].some((fileName) =>
      activity.title.includes(fileName) || activity.note.includes(fileName)
    );
  });

  return normalizeWorkspaceState({
    files,
    transactions,
    activities,
    categories: state.categories,
    merchantMappings: state.merchantMappings,
    budgetPlans: state.budgetPlans,
  });
}

export function useFileWorkspace() {
  const [state, setState] = useState<FileWorkspaceState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILE_WORKSPACE_STORAGE_KEY);
      if (raw) {
        setState(normalizeWorkspaceState(JSON.parse(raw)));
      }
    } catch {
      window.localStorage.removeItem(FILE_WORKSPACE_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(FILE_WORKSPACE_STORAGE_KEY, JSON.stringify(state));
  }, [isHydrated, state]);

  const summary = useMemo(() => {
    const processed = state.files.filter((file) => file.status === "processed").length;
    const review = state.files.filter((file) => file.status === "review").length;
    const recent = state.activities.filter((activity) => {
      const diff = Date.now() - new Date(activity.createdAt).getTime();
      return diff < 7 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      totalFiles: state.files.length,
      processed,
      review,
      recent,
    };
  }, [state.activities, state.files]);

  const processedBackupState = useMemo(
    () => buildProcessedWorkspaceState(state),
    [state]
  );

  async function uploadFiles(files: FileList | File[], selectedBank: string) {
    const list = Array.from(files).filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (list.length === 0) {
      setError("Pilih file PDF yang valid untuk diproses.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const results: ParsedPdfResult[] = [];
      for (const file of list) {
        const parsed = await parseBcaPdf(file);
        results.push({
          ...parsed,
          file: {
            ...parsed.file,
            bank: selectedBank.toUpperCase(),
          },
        });
      }

      setState((current) => ({
        ...current,
        files: mergeFiles([...results.map((result) => result.file), ...current.files]),
        transactions: dedupeTransactions([
          ...results.flatMap((result) => result.transactions),
          ...current.transactions,
        ]),
        activities: mergeActivities([
          ...results.map((result) => result.activity),
          ...current.activities,
        ]),
      }));

      const totalTransactions = results.reduce(
        (count, result) => count + result.transactions.length,
        0
      );

      toast("File berhasil disimpan", {
        description:
          list.length === 1
            ? `${results[0]?.file.name ?? "PDF"} disimpan dengan ${totalTransactions} transaksi.`
            : `${list.length} file disimpan dengan total ${totalTransactions} transaksi.`,
      });
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "PDF gagal diproses. Coba gunakan file dengan text layer.";

      setError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function resetAll() {
    setState(defaultState);
    setError(null);
    window.localStorage.removeItem(FILE_WORKSPACE_STORAGE_KEY);
  }

  function backupToJson() {
    const payload: FileWorkspaceBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      state: processedBackupState,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);

    anchor.href = url;
    anchor.download = `mbg-backup-${datePart}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast("Backup berhasil dibuat", {
      description: `${processedBackupState.files.length} file, ${processedBackupState.transactions.length} transaksi, ${processedBackupState.categories.length} kategori, ${processedBackupState.merchantMappings.length} merchant mapping, dan ${processedBackupState.budgetPlans.length} budget plan berhasil diunduh.`,
    });
  }

  async function restoreFromJson(file: File) {
    setIsRestoring(true);
    setError(null);

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as
        | FileWorkspaceBackup
        | FileWorkspaceState;
      const nextState =
        "state" in parsed ? normalizeWorkspaceState(parsed.state) : normalizeWorkspaceState(parsed);

      const restoredAt = new Date().toISOString();

      setState({
        ...nextState,
        activities: mergeActivities([
          {
            id: `restore-${Date.now()}`,
            title: `${file.name} berhasil direstore`,
            note: `${nextState.files.length} file, ${nextState.transactions.length} transaksi, ${nextState.categories.length} kategori, ${nextState.merchantMappings.length} merchant mapping, dan ${nextState.budgetPlans.length} budget plan dimuat dari backup lokal.`,
            createdAt: restoredAt,
            tone: "success",
          },
          ...nextState.activities,
        ]),
      });

      toast("Backup berhasil dipulihkan", {
        description: `${nextState.files.length} file, ${nextState.transactions.length} transaksi, ${nextState.categories.length} kategori, ${nextState.merchantMappings.length} merchant mapping, dan ${nextState.budgetPlans.length} budget plan dimuat kembali.`,
      });
    } catch {
      setError("File backup JSON tidak valid atau tidak cocok dengan format workspace.");
      toast("Restore gagal", {
        description: "File JSON tidak bisa dibaca sebagai backup workspace MBG.",
      });
    } finally {
      setIsRestoring(false);
    }
  }

  function markFileProcessed(fileId: string) {
    let processedFileName = "";

    setState((current) => {
      const files = current.files.map((file) => {
        if (file.id !== fileId) {
          return file;
        }

        processedFileName = file.name;

        return {
          ...file,
          status: "processed" as const,
        };
      });

      const activities = mergeActivities([
        {
          id: `${fileId}-processed-${Date.now()}`,
          title: `${processedFileName} ditandai sebagai processed`,
          note: "File sudah lolos review manual dan siap dipakai ke dashboard.",
          createdAt: new Date().toISOString(),
          tone: "success" as const,
        },
        ...current.activities,
      ]);

      return {
        ...current,
        files,
        activities,
      };
    });

    toast("Status diperbarui", {
      description: `${processedFileName || "File"} ditandai sebagai processed.`,
    });
  }

  function reparseFile(fileId: string) {
    let fileName = "";
    let reparseSucceeded = false;

    setState((current) => {
      const targetFile = current.files.find((file) => file.id === fileId);

      if (!targetFile?.rawText) {
        return current;
      }

      fileName = targetFile.name;

      const { statementPeriod, transactions } = parseBcaStatementText(
        targetFile.rawText,
        targetFile.name
      );

      reparseSucceeded = true;

      const files = current.files.map((file) =>
        file.id === fileId
          ? {
              ...file,
              statementPeriod,
              transactionCount: transactions.length,
              status: "review" as const,
              issueCount: transactions.length > 0 ? 0 : 1,
            }
          : file
      );

      const transactionsWithoutTarget = current.transactions.filter(
        (transaction) => transaction.sourceFile !== targetFile.name
      );

      const activities = mergeActivities([
        {
          id: `${fileId}-reparse-${Date.now()}`,
          title: `${targetFile.name} diparse ulang`,
          note:
            transactions.length > 0
              ? `${transactions.length} transaksi dibaca ulang. File tetap berada di review queue sampai dicek manual.`
              : "Hasil parse ulang belum menemukan transaksi yang konsisten. Cek raw text atau upload ulang file.",
          createdAt: new Date().toISOString(),
          tone: "warning" as const,
        },
        ...current.activities,
      ]);

      return {
        ...current,
        files,
        transactions: dedupeTransactions(
          [...transactionsWithoutTarget, ...transactions].filter(
            (transaction): transaction is ParsedTransaction => Boolean(transaction),
          ),
        ),
        activities,
      };
    });

    if (!reparseSucceeded) {
      toast("Re-parse tidak tersedia", {
        description: "Raw text untuk file ini tidak tersedia di storage lokal.",
      });
      return;
    }

    toast("File diparse ulang", {
      description: `${fileName || "File"} berhasil diparse ulang dan tetap menunggu review.`,
    });
  }

  function deleteFile(fileId: string) {
    let deletedFileName = "";

    setState((current) => {
      const targetFile = current.files.find((file) => file.id === fileId);

      if (!targetFile) {
        return current;
      }

      deletedFileName = targetFile.name;

      return {
        ...current,
        files: current.files.filter((file) => file.id !== fileId),
        transactions: current.transactions.filter(
          (transaction) => transaction.sourceFile !== targetFile.name
        ),
        activities: current.activities.filter(
          (activity) =>
            !activity.title.includes(targetFile.name) &&
            !activity.note.includes(targetFile.name)
        ),
      };
    });

    toast("File dihapus", {
      description: `${deletedFileName || "File"} dihapus dari workspace.`,
    });
  }

  function updateTransaction(
    transactionId: string,
    payload: {
      date: string;
      description: string;
      type: TransactionType;
      amount: number;
      balance: number | null;
    }
  ) {
    let sourceFileName = "";

    setState((current) => {
      const transactions = current.transactions.map((transaction) => {
        if (transaction.id !== transactionId) {
          return transaction;
        }

        sourceFileName = transaction.sourceFile;

        return {
          ...transaction,
          date: payload.date,
          description: payload.description,
          type: payload.type,
          amount: payload.amount,
          balance: payload.balance,
          categoryId: transaction.categoryId ?? null,
        };
      });

      return {
        ...current,
        transactions: dedupeTransactions(transactions),
        activities: mergeActivities([
          {
            id: `${transactionId}-edited-${Date.now()}`,
            title: `Transaksi pada ${sourceFileName || "file"} diperbarui`,
            note: "Perubahan manual disimpan dari review queue.",
            createdAt: new Date().toISOString(),
            tone: "warning" as const,
          },
          ...current.activities,
        ]),
      };
    });

    toast("Transaksi diperbarui", {
      description: "Perubahan manual berhasil disimpan.",
    });
  }

  function deleteTransaction(transactionId: string) {
    let sourceFileName = "";

    setState((current) => {
      const targetTransaction = current.transactions.find(
        (transaction) => transaction.id === transactionId
      );

      if (!targetTransaction) {
        return current;
      }

      sourceFileName = targetTransaction.sourceFile;

      const transactions = current.transactions.filter(
        (transaction) => transaction.id !== transactionId
      );

      return {
        ...current,
        transactions,
        files: syncFilesWithTransactions(current.files, transactions),
        activities: mergeActivities([
          {
            id: `${transactionId}-deleted-${Date.now()}`,
            title: `Satu transaksi dihapus dari ${targetTransaction.sourceFile}`,
            note: "Row transaksi dihapus manual dari preview hasil parsing.",
            createdAt: new Date().toISOString(),
            tone: "warning" as const,
          },
          ...current.activities,
        ]),
      };
    });

    toast("Transaksi dihapus", {
      description: `Row transaksi dari ${sourceFileName || "file"} berhasil dihapus.`,
    });
  }

  function setTransactionCategory(transactionId: string, categoryId: string | null) {
    let categoryName = "";

    setState((current) => {
      const targetCategory = categoryId
        ? current.categories.find((category) => category.id === categoryId)
        : null;

      categoryName = targetCategory?.name ?? "";

      return {
        ...current,
        transactions: current.transactions.map((transaction) =>
          transaction.id === transactionId
            ? {
                ...transaction,
                categoryId,
              }
            : transaction,
        ),
      };
    });

    toast("Kategori transaksi diperbarui", {
      description: categoryId
        ? `Transaksi dipindahkan ke kategori ${categoryName}.`
        : "Kategori transaksi dikembalikan ke auto matching.",
    });
  }

  function addCategory(payload: {
    name: string;
    color: CategoryColor;
    keywords: string[];
  }) {
    const nextCategoryName = payload.name.trim();

    setState((current) => {
      const nextCategory: WorkspaceCategory = {
        id: `category-${Date.now()}`,
        name: nextCategoryName,
        color: payload.color,
        priority:
          (current.categories.length > 0
            ? Math.max(...current.categories.map((category) => category.priority))
            : 0) + 10,
        keywords: normalizeKeywords(payload.keywords),
      };

      return {
        ...current,
        categories: reindexCategoryPriorities([
          nextCategory,
          ...current.categories,
        ]),
      };
    });

    toast("Kategori ditambahkan", {
      description: `${nextCategoryName} berhasil ditambahkan ke workspace.`,
    });
  }

  function updateCategory(
    categoryId: string,
    payload: {
      name: string;
      color: CategoryColor;
      keywords: string[];
    },
  ) {
    setState((current) => ({
      ...current,
        categories: current.categories.map((category) =>
          category.id === categoryId
          ? {
              ...category,
              name: payload.name.trim(),
              color: payload.color,
              keywords: normalizeKeywords(payload.keywords),
            }
          : category,
        ),
      }));

    toast("Kategori diperbarui", {
      description: "Perubahan kategori berhasil disimpan.",
    });
  }

  function deleteCategory(categoryId: string) {
    let deletedCategoryName = "";

    setState((current) => {
      const target = current.categories.find((category) => category.id === categoryId);

      if (!target) {
        return current;
      }

      deletedCategoryName = target.name;

      return {
        ...current,
        categories: current.categories.filter((category) => category.id !== categoryId),
        merchantMappings: current.merchantMappings.filter(
          (mapping) => mapping.categoryId !== categoryId,
        ),
        budgetPlans: current.budgetPlans.map((plan) => ({
          ...plan,
          categoryPlans: plan.categoryPlans.filter(
            (item) => item.categoryId !== categoryId,
          ),
        })),
        transactions: current.transactions.map((transaction) =>
          transaction.categoryId === categoryId
            ? {
                ...transaction,
                categoryId: null,
              }
            : transaction,
        ),
      };
    });

    toast("Kategori dihapus", {
      description: `${deletedCategoryName || "Kategori"} dihapus dari workspace.`,
    });
  }

  function moveCategoryPriority(categoryId: string, direction: "up" | "down") {
    setState((current) => {
      const categories = sortCategoriesByPriority(current.categories);
      const index = categories.findIndex((category) => category.id === categoryId);

      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= categories.length) {
        return current;
      }

      const nextCategories = [...categories];
      const currentItem = nextCategories[index];
      nextCategories[index] = nextCategories[targetIndex];
      nextCategories[targetIndex] = currentItem;

      return {
        ...current,
        categories: reindexCategoryPriorities(nextCategories),
      };
    });

    toast("Prioritas rule diperbarui", {
      description:
        direction === "up"
          ? "Rule dinaikkan ke prioritas yang lebih tinggi."
          : "Rule diturunkan ke prioritas yang lebih rendah.",
    });
  }

  function setMerchantCategory(
    merchantKey: string,
    merchantName: string,
    categoryId: string | null,
  ) {
    let categoryName = "";

    setState((current) => {
      const nextMerchantKey = normalizeMerchantKey(merchantKey);
      const nextMerchantName = merchantName.trim() || merchantKey;

      if (!categoryId) {
        return {
          ...current,
          merchantMappings: current.merchantMappings.filter(
            (mapping) => mapping.merchantKey !== nextMerchantKey,
          ),
        };
      }

      categoryName =
        current.categories.find((category) => category.id === categoryId)?.name ?? "";

      const existing = current.merchantMappings.find(
        (mapping) => mapping.merchantKey === nextMerchantKey,
      );

      const nextMappings = existing
        ? current.merchantMappings.map((mapping) =>
            mapping.merchantKey === nextMerchantKey
              ? {
                  ...mapping,
                  merchantName: nextMerchantName,
                  categoryId,
                }
              : mapping,
          )
        : [
            ...current.merchantMappings,
            {
              id: `merchant-${Date.now()}`,
              merchantKey: nextMerchantKey,
              merchantName: nextMerchantName,
              categoryId,
              aliases: [],
            },
          ];

      return {
        ...current,
        merchantMappings: mergeMerchantMappings(nextMappings),
      };
    });

    toast("Merchant mapping diperbarui", {
      description: categoryId
        ? `${merchantName} dipetakan ke kategori ${categoryName}.`
        : `${merchantName} dikembalikan ke auto matching.`,
    });
  }

  function updateMerchantName(merchantKey: string, merchantName: string) {
    const nextMerchantKey = normalizeMerchantKey(merchantKey);
    const nextMerchantName = merchantName.trim();

    if (!nextMerchantName) {
      return;
    }

    setState((current) => {
      const existing = current.merchantMappings.find(
        (mapping) => mapping.merchantKey === nextMerchantKey,
      );

      const nextMappings = existing
        ? current.merchantMappings.map((mapping) =>
            mapping.merchantKey === nextMerchantKey
              ? { ...mapping, merchantName: nextMerchantName }
              : mapping,
          )
        : [
            ...current.merchantMappings,
            {
              id: `merchant-${Date.now()}`,
              merchantKey: nextMerchantKey,
              merchantName: nextMerchantName,
              categoryId: null,
              aliases: [],
            },
          ];

      return {
        ...current,
        merchantMappings: mergeMerchantMappings(nextMappings),
      };
    });

    toast("Nama merchant diperbarui", {
      description: `${nextMerchantName} berhasil disimpan di workspace.`,
    });
  }

  function mergeMerchantMapping(sourceMerchantKey: string, targetMerchantKey: string) {
    const sourceKey = normalizeMerchantKey(sourceMerchantKey);
    const targetKey = normalizeMerchantKey(targetMerchantKey);

    if (!sourceKey || !targetKey || sourceKey === targetKey) {
      return;
    }

    let sourceName = sourceKey;
    let targetName = targetKey;

    setState((current) => {
      const sourceMapping =
        current.merchantMappings.find((mapping) => mapping.merchantKey === sourceKey) ??
        null;
      const targetMapping =
        current.merchantMappings.find((mapping) => mapping.merchantKey === targetKey) ??
        null;

      sourceName = sourceMapping?.merchantName ?? sourceKey;
      targetName = targetMapping?.merchantName ?? targetKey;

      const mergedAliases = [...new Set([
        ...(targetMapping?.aliases ?? []),
        ...(sourceMapping?.aliases ?? []),
        sourceKey,
      ])].filter((alias) => alias !== targetKey);

      const nextTarget: MerchantMapping = targetMapping
        ? {
            ...targetMapping,
            categoryId: targetMapping.categoryId ?? sourceMapping?.categoryId ?? null,
            aliases: mergedAliases,
          }
        : {
            id: `merchant-${Date.now()}`,
            merchantKey: targetKey,
            merchantName: targetName,
            categoryId: sourceMapping?.categoryId ?? null,
            aliases: mergedAliases,
          };

      const remainingMappings = current.merchantMappings.filter(
        (mapping) =>
          mapping.merchantKey !== sourceKey && mapping.merchantKey !== targetKey,
      );

      return {
        ...current,
        merchantMappings: mergeMerchantMappings([
          ...remainingMappings,
          nextTarget,
        ]),
      };
    });

    toast("Merchant digabungkan", {
      description: `${sourceName} sekarang digabung ke ${targetName}.`,
    });
  }

  function upsertBudgetPlan(payload: {
    month: string;
    incomeTarget: number;
    expenseTarget: number;
    savingsTarget: number;
    categoryPlans: {
      categoryId: string;
      amount: number;
    }[];
  }) {
    let isUpdate = false;

    setState((current) => {
      const existing = current.budgetPlans.find((plan) => plan.month === payload.month);
      const now = new Date().toISOString();
      const nextPlan: BudgetPlan = {
        id: existing?.id ?? `budget-${Date.now()}`,
        month: payload.month,
        incomeTarget: Math.max(0, Math.round(payload.incomeTarget)),
        expenseTarget: Math.max(0, Math.round(payload.expenseTarget)),
        savingsTarget: Math.max(0, Math.round(payload.savingsTarget)),
        categoryPlans: payload.categoryPlans
          .filter((item) => item.amount > 0)
          .map((item) => ({
            categoryId: item.categoryId,
            amount: Math.round(item.amount),
          }))
          .sort((a, b) => b.amount - a.amount),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      isUpdate = Boolean(existing);

      return {
        ...current,
        budgetPlans: mergeBudgetPlans([
          nextPlan,
          ...current.budgetPlans.filter((plan) => plan.month !== payload.month),
        ]),
      };
    });

    toast(isUpdate ? "Budget plan diperbarui" : "Budget plan disimpan", {
      description: `Plan untuk ${payload.month} berhasil ${
        isUpdate ? "diperbarui" : "disimpan"
      }.`,
    });
  }

  function deleteBudgetPlan(month: string) {
    let deleted = false;

    setState((current) => {
      const exists = current.budgetPlans.some((plan) => plan.month === month);

      if (!exists) {
        return current;
      }

      deleted = true;

      return {
        ...current,
        budgetPlans: current.budgetPlans.filter((plan) => plan.month !== month),
      };
    });

    if (!deleted) {
      return;
    }

    toast("Budget plan dihapus", {
      description: `Plan untuk ${month} berhasil dihapus.`,
    });
  }

  return {
    state,
    summary,
    processedBackupState,
    isHydrated,
    isUploading,
    isRestoring,
    error,
    uploadFiles,
    backupToJson,
    restoreFromJson,
    markFileProcessed,
    reparseFile,
    deleteFile,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    setTransactionCategory,
    setMerchantCategory,
    updateMerchantName,
    mergeMerchantMapping,
    upsertBudgetPlan,
    deleteBudgetPlan,
    deleteCategory,
    moveCategoryPriority,
    resetAll,
  };
}
