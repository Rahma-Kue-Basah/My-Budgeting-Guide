"use client";

import type {
  ImportActivity,
  ParsedPdfResult,
  ParsedTransaction,
  TransactionType,
  UploadedPdfFile,
} from "@/types/transaction";

type TextItem = {
  str?: string;
  transform?: number[];
};

const MONTHS: Record<string, number> = {
  JANUARI: 0,
  FEBRUARI: 1,
  MARET: 2,
  APRIL: 3,
  MEI: 4,
  JUNI: 5,
  JULI: 6,
  AGUSTUS: 7,
  SEPTEMBER: 8,
  OKTOBER: 9,
  NOVEMBER: 10,
  DESEMBER: 11,
};

const STOP_PATTERNS = [
  "BERSAMBUNG KE HALAMAN BERIKUT",
  "REKENING TAHAPAN",
  "NO. REKENING",
  "HALAMAN :",
  "HALAMAN:",
  "PERIODE :",
  "PERIODE:",
  "KOTAKAN MATA UANG",
  "C A T A T A N",
  "CATATAN :",
  "CATATAN:",
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function hashText(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function parseAmount(value: string) {
  return Number(value.replace(/,/g, ""));
}

function formatPeriod(month: number, year: number) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "numeric",
  }).format(new Date(year, month, 1));
}

function detectStatementPeriod(text: string) {
  const periodMatch = text.match(/PERIODE\s*:?\s*([A-Z]+)\s+(\d{4})/i);
  if (!periodMatch) {
    return null;
  }

  const month = MONTHS[periodMatch[1].toUpperCase()];
  const year = Number(periodMatch[2]);

  if (month === undefined || Number.isNaN(year)) {
    return null;
  }

  return {
    month,
    year,
    label: formatPeriod(month, year),
  };
}

function extractLines(items: TextItem[]) {
  const grouped = new Map<number, { x: number; text: string }[]>();

  for (const item of items) {
    const text = item.str?.trim();
    const transform = item.transform;

    if (!text || !transform) {
      continue;
    }

    const y = Math.round(transform[5]);
    const x = Math.round(transform[4]);
    const row = grouped.get(y) ?? [];
    row.push({ x, text });
    grouped.set(y, row);
  }

  return [...grouped.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) =>
      normalizeWhitespace(
        row
          .sort((a, b) => a.x - b.x)
          .map((entry) => entry.text)
          .join(" ")
      )
    )
    .filter(Boolean);
}

function sanitizeDescription(value: string) {
  let description = value;

  description = description.replace(/^\d{2}\/\d{2}\s+/, "");
  description = description.replace(/\b(DB|CR|KR)\b/g, " ");
  description = description.replace(/\d[\d,]*\.\d{2}/g, " ");
  description = description.replace(/\bTGL:\s*\d{2}\/\d{2}\b/gi, " ");

  for (const pattern of STOP_PATTERNS) {
    const index = description.toUpperCase().indexOf(pattern);
    if (index >= 0) {
      description = description.slice(0, index);
    }
  }

  return normalizeWhitespace(description);
}

function isNonTransactionDescription(value: string) {
  const normalized = value.toUpperCase();
  return normalized.includes("SALDO AWAL");
}

function parseTransactionBlock(
  block: string,
  sourceFile: string,
  fallbackPeriod: { month: number; year: number } | null
) {
  const dateMatch = block.match(/^(\d{2})\/(\d{2})\b/);
  if (!dateMatch || !fallbackPeriod) {
    return null;
  }

  const day = Number(dateMatch[1]);
  const month = fallbackPeriod.month;
  const year = fallbackPeriod.year;

  const typeRaw = block.match(/\b(DB|CR|KR)\b/)?.[1];
  const type: TransactionType =
    typeRaw === "DB" ? "debit" : typeRaw ? "credit" : "debit";

  const numbers = [...block.matchAll(/\d[\d,]*\.\d{2}/g)].map((match) =>
    parseAmount(match[0])
  );

  if (numbers.length === 0) {
    return null;
  }

  const amount = numbers[0];
  let balance = numbers.length > 1 ? numbers[1] : null;

  if (numbers.length > 2 && Math.round(numbers[2] * 100) === Math.round(amount * 100)) {
    balance = numbers[1] ?? null;
  }

  const description = sanitizeDescription(block);
  if (!description || isNonTransactionDescription(description)) {
    return null;
  }

  const date = new Date(year, month, day);
  const dateValue = Number.isNaN(date.getTime()) ? null : date.toISOString();
  if (!dateValue) {
    return null;
  }

  const id = hashText(
    `${dateValue}|${description}|${type}|${amount}|${balance ?? "none"}|${sourceFile}`
  );

  return {
    id,
    date: dateValue,
    description,
    type,
    amount,
    balance,
    sourceFile,
    categoryId: null,
  } satisfies ParsedTransaction;
}

function buildTransactionBlocks(lines: string[]) {
  const blocks: string[] = [];
  let current: string[] = [];

  for (const rawLine of lines) {
    const line = normalizeWhitespace(rawLine);
    if (!line) {
      continue;
    }

    const upper = line.toUpperCase();

    if (STOP_PATTERNS.some((pattern) => upper.includes(pattern))) {
      if (current.length > 0) {
        blocks.push(current.join(" "));
        current = [];
      }
      continue;
    }

    if (/^\d{2}\/\d{2}\b/.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join(" "));
      }
      current = [line];
      continue;
    }

    if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    blocks.push(current.join(" "));
  }

  return blocks;
}

export function parseBcaStatementText(text: string, sourceFile: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);
  const period = detectStatementPeriod(text);
  const blocks = buildTransactionBlocks(lines);

  const transactions = blocks
    .map((block) =>
      parseTransactionBlock(
        block,
        sourceFile,
        period ? { month: period.month, year: period.year } : null
      )
    )
    .filter(Boolean) as ParsedTransaction[];

  return {
    statementPeriod: period?.label ?? null,
    transactions,
  };
}

async function extractTextLines(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const buffer = await file.arrayBuffer();
  const document = await pdfjs.getDocument({ data: buffer }).promise;
  const lines: string[] = [];

  for (let pageIndex = 1; pageIndex <= document.numPages; pageIndex += 1) {
    const page = await document.getPage(pageIndex);
    const textContent = await page.getTextContent();
    lines.push(...extractLines(textContent.items as TextItem[]));
  }

  return lines;
}

export async function parseBcaPdf(file: File): Promise<ParsedPdfResult> {
  const lines = await extractTextLines(file);
  const text = lines.join("\n");
  const { statementPeriod, transactions } = parseBcaStatementText(text, file.name);

  // New uploads should enter manual review first, even when parsing succeeds.
  const status: UploadedPdfFile["status"] = "review";

  const fileRecord: UploadedPdfFile = {
    id: `${slugify(file.name)}-${hashText(`${file.name}-${file.size}`)}`,
    name: file.name,
    bank: "BCA",
    rawText: text,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    statementPeriod,
    transactionCount: transactions.length,
    status,
    issueCount: transactions.length > 0 ? 0 : 1,
  };

  const activity: ImportActivity = {
    id: `${fileRecord.id}-activity`,
    title:
      transactions.length > 0
        ? `${file.name} menunggu review`
        : `${file.name} butuh review`,
    note:
      transactions.length > 0
        ? `${transactions.length} transaksi berhasil dibaca dan menunggu verifikasi manual.`
        : "Teks PDF tidak cukup konsisten untuk diparse penuh. Cek format file atau upload ulang.",
    createdAt: fileRecord.uploadedAt,
    tone: "warning",
  };

  return {
    file: fileRecord,
    transactions,
    activity,
  };
}
