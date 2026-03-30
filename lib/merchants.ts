import type { MerchantMapping, ParsedTransaction } from "@/types/transaction";

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeMerchantKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function extractMerchantName(description: string) {
  let next = description.replace(/\s+/g, " ").trim();

  const prefixPatterns = [
    /^transaksi debit tanggal\s*:?\s*\d{1,2}\/\d{1,2}\s*qr\s*\d+\s*/i,
    /^transaksi debit qrc?\s*\d+\s*/i,
    /^transaksi debit qr\s*\d+\s*/i,
    /^transaksi debit\s*/i,
    /^trsf e-banking\s*(db|cr)?\s*[\w/.-]*\s*/i,
    /^kr otomatis trf kolektif\s*/i,
  ];

  for (const pattern of prefixPatterns) {
    next = next.replace(pattern, "").trim();
  }

  next = next
    .replace(/tanggal\s*:?\s*\d{1,2}\/\d{1,2}/gi, " ")
    .replace(/\b\d{6,}\b/g, " ")
    .replace(/\b\d{3,5}\b/g, " ")
    .replace(/[@/]+/g, " ")
    .replace(/[^\p{L}\p{N}\s&.-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!next) {
    next = description.replace(/\s+/g, " ").trim();
  }

  if (!next) {
    return "Unknown merchant";
  }

  return toTitleCase(next);
}

export function extractMerchantKey(description: string) {
  return normalizeMerchantKey(extractMerchantName(description));
}

export function matchTransactionMerchantMapping(
  transaction: ParsedTransaction,
  merchantMappings: MerchantMapping[],
) {
  const merchantKey = extractMerchantKey(transaction.description);

  return (
    merchantMappings.find(
      (mapping) =>
        mapping.merchantKey === merchantKey ||
        mapping.aliases.includes(merchantKey),
    ) ?? null
  );
}

export function resolveTransactionMerchant(
  transaction: ParsedTransaction,
  merchantMappings: MerchantMapping[],
) {
  const extractedKey = extractMerchantKey(transaction.description);
  const extractedName = extractMerchantName(transaction.description);
  const mapping = matchTransactionMerchantMapping(transaction, merchantMappings);

  return {
    merchantKey: mapping?.merchantKey ?? extractedKey,
    merchantName: mapping?.merchantName ?? extractedName,
    extractedKey,
    extractedName,
    mapping,
  };
}
