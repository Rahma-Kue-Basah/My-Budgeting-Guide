import {
  buildTransactionSignature,
  createStableId,
  mergeTransactions,
} from "@/lib/transactions";
import type { ParsePdfResult, TransactionRecord, TransactionType } from "@/types/transaction";

interface TextItemWithTransform {
  str: string;
  transform: number[];
}

function isTextItemLike(item: unknown): item is TextItemWithTransform {
  if (!item || typeof item !== "object") {
    return false;
  }

  return "str" in item && "transform" in item && Array.isArray(item.transform);
}

function extractLineGroups(items: TextItemWithTransform[]): string[] {
  const rows = new Map<string, TextItemWithTransform[]>();

  for (const item of items) {
    const y = Math.round(item.transform[5]);
    const key = String(y);
    const current = rows.get(key) ?? [];
    current.push(item);
    rows.set(key, current);
  }

  return Array.from(rows.entries())
    .sort((left, right) => Number(right[0]) - Number(left[0]))
    .map(([, rowItems]) =>
      rowItems
        .sort((left, right) => left.transform[4] - right.transform[4])
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

const DATE_AT_START_REGEX = /^\s*(\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?)\b/;
const MONEY_REGEX =
  /(?:Rp\s*)?-?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2})/gi;
const CONTINUATION_MARKER_REGEX =
  /\b(?:bersambung ke halaman berikut|rekening tahapan|no\.\s*rekening|halaman\s*:|periode\s*:|mata uang\s*:|catatan\s*:)\b/i;

function normalizeAmount(rawValue: string): number {
  const sanitized = rawValue.replace(/[^\d,.-]/g, "");

  if (!sanitized) {
    return 0;
  }

  const lastComma = sanitized.lastIndexOf(",");
  const lastDot = sanitized.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex === -1) {
    return Number(sanitized.replace(/[^\d-]/g, ""));
  }

  const integerPart = sanitized.slice(0, decimalIndex).replace(/[^\d-]/g, "");
  const fractionalPart = sanitized
    .slice(decimalIndex + 1)
    .replace(/[^\d]/g, "")
    .slice(0, 2);

  return Number(`${integerPart}.${fractionalPart || "0"}`);
}

function parseDate(rawDate: string, fallbackYear: number | null): string | null {
  const match = rawDate.match(
    /(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{2,4}))?/
  );

  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearToken] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const inferredYear = yearToken
    ? Number(yearToken.length === 2 ? `20${yearToken}` : yearToken)
    : fallbackYear;

  if (!inferredYear) {
    return null;
  }

  const utcDate = new Date(
    Date.UTC(inferredYear, Math.max(month - 1, 0), day, 12, 0, 0)
  );

  if (
    Number.isNaN(utcDate.getTime()) ||
    utcDate.getUTCDate() !== day ||
    utcDate.getUTCMonth() !== month - 1
  ) {
    return null;
  }

  return utcDate.toISOString().slice(0, 10);
}

function inferStatementYear(lines: string[]): number | null {
  for (const line of lines) {
    const yearMatch = line.match(/(?:periode|period|tahun|year)[^\d]*(20\d{2})/i);

    if (yearMatch) {
      return Number(yearMatch[1]);
    }

    const standaloneYear = line.match(/\b(20\d{2})\b/);

    if (standaloneYear) {
      return Number(standaloneYear[1]);
    }
  }

  return new Date().getFullYear();
}

function inferTypeFromDescription(description: string): TransactionType | null {
  if (/\b(cr|kr|kredit|credit|setor|bunga)\b/i.test(description)) {
    return "credit";
  }

  if (/\b(db|debit|tarik|transfer keluar|pembayaran|biaya)\b/i.test(description)) {
    return "debit";
  }

  return null;
}

function shouldIgnoreStandaloneLine(line: string): boolean {
  const normalized = line.trim();

  if (!normalized) {
    return true;
  }

  if (/^(tanggal|keterangan|cbg|mutasi|saldo)\b/i.test(normalized)) {
    return true;
  }

  if (/^-+$/.test(normalized)) {
    return true;
  }

  if (
    /^(rekening tahapan|no\.\s*rekening|halaman\s*:|periode\s*:|mata uang\s*:|catatan\s*:)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

function stripContinuationNoise(line: string): string {
  const markerMatch = line.match(CONTINUATION_MARKER_REGEX);

  if (!markerMatch || markerMatch.index === undefined) {
    return line;
  }

  return line.slice(0, markerMatch.index).trim();
}

function mergeTransactionLines(lines: string[]): string[] {
  const mergedBlocks: string[] = [];
  let currentBlock = "";

  for (const line of lines) {
    const normalizedLine = stripContinuationNoise(
      line.replace(/\s+/g, " ").trim()
    );

    if (shouldIgnoreStandaloneLine(normalizedLine)) {
      continue;
    }

    if (DATE_AT_START_REGEX.test(normalizedLine)) {
      if (currentBlock) {
        mergedBlocks.push(currentBlock.trim());
      }

      currentBlock = normalizedLine;
      continue;
    }

    if (currentBlock) {
      currentBlock = `${currentBlock} ${normalizedLine}`.replace(/\s+/g, " ").trim();
    }
  }

  if (currentBlock) {
    mergedBlocks.push(currentBlock.trim());
  }

  return mergedBlocks;
}

function cleanupDescription(rawDescription: string): string {
  return rawDescription
    .replace(CONTINUATION_MARKER_REGEX, " ")
    .replace(/\b\d+\s*\/\s*\d+\s*halaman\b/gi, " ")
    .replace(/\b\d{10,}\b/g, " ")
    .replace(MONEY_REGEX, " ")
    .replace(/\b(?:DB|CR|KR)\b/gi, " ")
    .replace(/\b(?:TANGGAL|KETERANGAN|CBG|MUTASI|SALDO)\b/gi, " ")
    .replace(/\bTRANSAKSI\s+DEBIT\s+TGL\s*:?\b/gi, " ")
    .replace(/\bTGL\s*:?\s*\d{1,2}[\/.-]\d{1,2}(?:[\/.-]\d{2,4})?\b/gi, " ")
    .replace(/\s-\s/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAmounts(line: string): { amount: number; balance: number | null } | null {
  const typedMatch = line.match(
    /((?:Rp\s*)?-?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2}))\s*(DB|CR|KR)\s*(?:SALDO\s*)?((?:Rp\s*)?-?(?:\d{1,3}(?:[.,]\d{3})+|\d+)(?:[.,]\d{2}))?/i
  );

  if (typedMatch) {
    return {
      amount: normalizeAmount(typedMatch[1]),
      balance: typedMatch[3] ? normalizeAmount(typedMatch[3]) : null,
    };
  }

  const moneyMatches = Array.from(line.matchAll(MONEY_REGEX), (match) => match[0])
    .map(normalizeAmount)
    .filter((value) => value > 0);

  if (moneyMatches.length === 0) {
    return null;
  }

  if (moneyMatches.length === 1) {
    return {
      amount: moneyMatches[0],
      balance: null,
    };
  }

  if (moneyMatches.length >= 3) {
    const [candidateAmount, candidateBalance, trailingValue] = moneyMatches;

    if (
      candidateBalance > 0 &&
      trailingValue > 0 &&
      Math.abs(candidateAmount - trailingValue) < 0.005
    ) {
      return {
        amount: candidateAmount,
        balance: candidateBalance,
      };
    }
  }

  return {
    amount: moneyMatches[moneyMatches.length - 2],
    balance: moneyMatches[moneyMatches.length - 1],
  };
}

function parseLine(line: string, sourceFile: string, fallbackYear: number | null) {
  const dateMatch = line.match(DATE_AT_START_REGEX);

  if (!dateMatch) {
    return null;
  }

  const parsedDate = parseDate(dateMatch[1], fallbackYear);

  if (!parsedDate) {
    return null;
  }

  const workingLine = line.slice(dateMatch[0].length).trim();
  const amounts = extractAmounts(workingLine);

  if (!amounts) {
    return null;
  }

  let type: TransactionType | null = null;

  if (/\b(cr|kr|credit|kredit)\b/i.test(workingLine)) {
    type = "credit";
  } else if (/\b(db|debit)\b/i.test(workingLine)) {
    type = "debit";
  }

  const description = cleanupDescription(workingLine);

  if (!description) {
    return null;
  }

  const { amount, balance } = amounts;

  type = type ?? inferTypeFromDescription(description);

  if (!type && /\btrf kolektif|setor|bunga|masuk|penerimaan|kredit otomatis\b/i.test(description)) {
    type = "credit";
  }

  if (!type && balance !== null) {
    type = amount <= balance ? "credit" : "debit";
  }

  if (!type) {
    type = /masuk|transfer in|incoming/i.test(description) ? "credit" : "debit";
  }

  const seed = buildTransactionSignature({
    amount,
    balance,
    date: parsedDate,
    description,
    type,
  });

  const transaction: TransactionRecord = {
    id: createStableId(`${seed}|${sourceFile}|${line}`),
    amount,
    balance,
    date: parsedDate,
    description,
    rawLine: line,
    sourceFile,
    type,
  };

  return transaction;
}

async function extractTextLines(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const lines: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.reduce<TextItemWithTransform[]>(
      (accumulator, item) => {
        if (isTextItemLike(item)) {
          accumulator.push(item);
        }

        return accumulator;
      },
      []
    );

    lines.push(...extractLineGroups(textItems));
  }

  return lines;
}

export async function parseBcaMutationPdf(file: File): Promise<ParsePdfResult> {
  const lines = await extractTextLines(file);
  const mergedLines = mergeTransactionLines(lines);
  const fallbackYear = inferStatementYear(lines);
  const transactions: TransactionRecord[] = [];

  for (const line of mergedLines) {
    const parsedLine = parseLine(line, file.name, fallbackYear);

    if (parsedLine) {
      transactions.push(parsedLine);
    }
  }

  const dedupedTransactions = mergeTransactions([], transactions);
  const warnings: string[] = [];

  if (dedupedTransactions.length === 0) {
    warnings.push(
      `File "${file.name}" tidak menghasilkan transaksi yang bisa dikenali. Cek apakah PDF berupa scan/gambar atau format mutasi berbeda.`
    );
  }

  return {
    transactions: dedupedTransactions,
    warnings,
  };
}
