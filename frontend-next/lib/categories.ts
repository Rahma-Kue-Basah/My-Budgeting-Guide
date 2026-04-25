import type {
  CategoryColor,
  MerchantMapping,
  ParsedTransaction,
  WorkspaceCategory,
} from "@/types/transaction";
import { CATEGORY_COLOR_HEX } from "@/lib/color-palette";

const FOOD_KEYWORDS = [
  "warung",
  "warteg",
  "makan",
  "makanan",
  "kuliner",
  "resto",
  "restoran",
  "cafe",
  "coffee",
  "kopi",
  "bakso",
  "ayam",
  "mie",
  "nasi",
  "sate",
  "jajan",
  "snack",
  "minimarket food",
  "jus",
  "brew",
  "bang jus",
  "big brew",
  "st.zen",
  "cerita cin",
];

const SAVINGS_KEYWORDS = [
  "tabungan",
  "saving",
  "simpanan",
  "deposito",
  "deposit",
];

const TRANSFER_KEYWORDS = [
  "trsf",
  "transfer",
  "kliring",
  "rtgs",
  "otomatis ntrf",
  "ntrf",
  "transfer keluar",
  "transfer masuk",
];

const SALARY_KEYWORDS = [
  "gaji",
  "salary",
  "payroll",
  "tunjangan",
  "thr",
  "bonus",
  "honor",
  "insentif",
  "upah",
  "teacher fee",
];

const LOAN_KEYWORDS = [
  "loan",
  "pinjaman",
  "angsuran",
  "cicilan",
  "kredit",
  "paylater",
  "spaylater",
  "gopaylater",
  "kredivo",
  "akulaku",
];

const KOS_KEYWORDS = [
  "kos",
  "kost",
  "indekos",
  "kontrakan",
  "sewa kamar",
  "mamikos",
];

const TRANSPORT_KEYWORDS = [
  "gojek",
  "gocar",
  "goride",
  "grab",
  "grabcar",
  "grabbike",
  "transport",
  "transportasi",
  "taksi",
  "taxi",
  "parkir",
  "tol",
  "bensin",
  "bbm",
  "spbu",
  "pertamina",
  "shell",
  "kai",
  "kereta",
  "mrt",
  "transjakarta",
];

const BILL_KEYWORDS = [
  "pln",
  "bpjs",
  "internet",
  "wifi",
  "telkom",
  "tagihan",
  "listrik",
  "air",
  "pam",
  "pdam",
  "indihome",
  "biznet",
  "myrepublic",
  "first media",
  "ioh",
  "indosat",
  "im3",
  "kuota",
  "pulsa",
  "data",
  "paket data",
];

const CASH_KEYWORDS = ["tarik cash", "atm", "tunai", "tarik tunai", "cash"];

const LAUNDRY_KEYWORDS = [
  "laundry",
  "cuci",
  "setrika",
  "dry clean",
  "dryclean",
  "loundry",
];

const SHOPPING_KEYWORDS = [
  "alfagift",
  "indomaret",
  "tokopedia",
  "shopee",
  "lazada",
  "aeon",
  "blibli",
  "mart",
  "idm",
  "indoma",
  "toko",
  "semba",
  "belanja",
  "shopping",
  "supermarket",
  "minimarket",
];

const TOP_UP_KEYWORDS = [
  "flazz",
  "topup",
  "top up",
  "flazz bca",
  "ovo",
  "gopay",
  "dana",
  "shopeepay",
  "linkaja",
  "e-money",
  "emoney",
];

const ADMIN_KEYWORDS = [
  "biaya adm",
  "admin",
  "biaya admin",
  "admin fee",
  "fee admin",
];

const DONATION_KEYWORDS = [
  "donasi",
  "zakat",
  "infak",
  "infaq",
  "sedekah",
  "sumbangan",
  "charity",
  "amal",
  "masjid",
  "panti asuhan",
];

export const DEFAULT_CATEGORIES: WorkspaceCategory[] = [
  {
    id: "savings",
    name: "Savings",
    color: "sky",
    priority: 140,
    keywords: SAVINGS_KEYWORDS,
  },
  {
    id: "transfer",
    name: "Transfer",
    color: "indigo",
    priority: 130,
    keywords: TRANSFER_KEYWORDS,
  },
  {
    id: "salary",
    name: "Salary",
    color: "emerald",
    priority: 120,
    keywords: SALARY_KEYWORDS,
  },
  {
    id: "loan",
    name: "Loan",
    color: "rose",
    priority: 110,
    keywords: LOAN_KEYWORDS,
  },
  {
    id: "kos",
    name: "Kos",
    color: "rose",
    priority: 100,
    keywords: KOS_KEYWORDS,
  },
  {
    id: "food",
    name: "Food",
    color: "rose",
    priority: 90,
    keywords: FOOD_KEYWORDS,
  },
  {
    id: "transport",
    name: "Transport",
    color: "emerald",
    priority: 80,
    keywords: TRANSPORT_KEYWORDS,
  },
  {
    id: "bill",
    name: "Bill",
    color: "sky",
    priority: 75,
    keywords: BILL_KEYWORDS,
  },
  {
    id: "cash",
    name: "Cash",
    color: "amber",
    priority: 70,
    keywords: CASH_KEYWORDS,
  },
  {
    id: "laundry",
    name: "Laundry",
    color: "amber",
    priority: 60,
    keywords: LAUNDRY_KEYWORDS,
  },
  {
    id: "topup",
    name: "Top Up",
    color: "violet",
    priority: 50,
    keywords: TOP_UP_KEYWORDS,
  },
  {
    id: "shopping",
    name: "Shopping",
    color: "rose",
    priority: 40,
    keywords: SHOPPING_KEYWORDS,
  },
  {
    id: "admin",
    name: "Admin Fee",
    color: "amber",
    priority: 30,
    keywords: ADMIN_KEYWORDS,
  },
  {
    id: "donasi",
    name: "Donasi",
    color: "emerald",
    priority: 20,
    keywords: DONATION_KEYWORDS,
  },
];

export const CATEGORY_COLOR_OPTIONS: {
  value: CategoryColor;
  label: string;
  color: string;
}[] = [
  { value: "indigo", label: "Blue", color: CATEGORY_COLOR_HEX.indigo },
  { value: "emerald", label: "Green", color: CATEGORY_COLOR_HEX.emerald },
  { value: "amber", label: "Orange", color: CATEGORY_COLOR_HEX.amber },
  { value: "violet", label: "Graphite", color: CATEGORY_COLOR_HEX.violet },
  { value: "sky", label: "BCA", color: CATEGORY_COLOR_HEX.sky },
  { value: "rose", label: "Gold", color: CATEGORY_COLOR_HEX.rose },
];

export const CATEGORY_COLOR_STYLES: Record<
  CategoryColor,
  {
    badge: string;
    card: string;
    dot: string;
  }
> = {
  indigo: {
    badge: "border-[#007aff]/20 bg-[#007aff]/10 text-[#007aff]",
    card: "border-[#007aff]/20 bg-[#007aff]/[0.08]",
    dot: "bg-[#007aff]",
  },
  sky: {
    badge: "border-[#1155cc]/20 bg-[#1155cc]/10 text-[#1155cc]",
    card: "border-[#1155cc]/20 bg-[#1155cc]/[0.08]",
    dot: "bg-[#1155cc]",
  },
  emerald: {
    badge: "border-[#30d158]/20 bg-[#30d158]/10 text-[#1f8f43]",
    card: "border-[#30d158]/20 bg-[#30d158]/[0.08]",
    dot: "bg-[#30d158]",
  },
  amber: {
    badge: "border-[#ff9f0a]/20 bg-[#ff9f0a]/10 text-[#c26d00]",
    card: "border-[#ff9f0a]/20 bg-[#ff9f0a]/[0.08]",
    dot: "bg-[#ff9f0a]",
  },
  rose: {
    badge: "border-[#b8860b]/20 bg-[#b8860b]/10 text-[#8c6500]",
    card: "border-[#b8860b]/20 bg-[#b8860b]/[0.08]",
    dot: "bg-[#b8860b]",
  },
  violet: {
    badge: "border-[#1c1c1e]/15 bg-[#1c1c1e]/10 text-[#1c1c1e]",
    card: "border-[#1c1c1e]/15 bg-[#1c1c1e]/[0.06]",
    dot: "bg-[#1c1c1e]",
  },
};

export function normalizeKeywords(value: string[]) {
  return [...new Set(value.map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

export function sortCategoriesByPriority(categories: WorkspaceCategory[]) {
  return [...categories].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }

    return a.name.localeCompare(b.name);
  });
}

export function reindexCategoryPriorities(categories: WorkspaceCategory[]) {
  const total = categories.length;

  return categories.map((category, index) => ({
    ...category,
    priority: total - index,
  }));
}

function migrateLegacyCategories(categories: WorkspaceCategory[]): WorkspaceCategory[] {
  const foodExists = categories.some((category) => category.id === "food");

  const migrated = categories.map((category) => {
    if (category.id === "bill") {
      return {
        ...category,
        name:
          category.name.toLowerCase() === "bill & data" ? "Bill" : category.name,
        keywords: normalizeKeywords([...BILL_KEYWORDS, ...category.keywords]),
        priority: category.priority ?? 75,
      };
    }

    if (category.id !== "shopping") {
      return category;
    }

    const nextName =
      category.name.toLowerCase() === "shopping & food"
        ? "Shopping"
        : category.name;

    const nextKeywords = category.keywords.filter(
      (keyword) => !FOOD_KEYWORDS.includes(keyword.toLowerCase()),
    );

    return {
      ...category,
      name: nextName,
      keywords: normalizeKeywords(nextKeywords),
      priority: category.priority ?? 70,
    };
  });

  if (foodExists) {
    return migrated;
  }

  const legacyShopping = categories.find((category) => category.id === "shopping");
  const migratedFoodKeywords = normalizeKeywords([
    ...FOOD_KEYWORDS,
    ...(legacyShopping?.keywords.filter((keyword) =>
      FOOD_KEYWORDS.includes(keyword.toLowerCase()),
    ) ?? []),
  ]);

  return [
    ...migrated,
    {
      id: "food",
      name: "Food",
      color: "rose",
      priority: 90,
      keywords: migratedFoodKeywords,
    },
  ];
}

export function mergeDefaultCategories(
  categories: WorkspaceCategory[],
): WorkspaceCategory[] {
  const migratedCategories = migrateLegacyCategories(categories);
  const existingById = new Map(
    migratedCategories.map((category) => [category.id, category]),
  );

  const merged = migratedCategories
    .map((category) => ({
      ...category,
      keywords: normalizeKeywords(category.keywords),
      priority:
        category.priority ??
        DEFAULT_CATEGORIES.find((defaultCategory) => defaultCategory.id === category.id)
          ?.priority ??
        50,
    }) satisfies WorkspaceCategory)
    .concat(
      DEFAULT_CATEGORIES.filter(
        (defaultCategory) => !existingById.has(defaultCategory.id),
      ),
    );

  return reindexCategoryPriorities(sortCategoriesByPriority(merged));
}

export function matchTransactionCategory(
  transaction: ParsedTransaction,
  categories: WorkspaceCategory[],
  merchantMappings: MerchantMapping[] = [],
) {
  const description = transaction.description.toLowerCase();

  void merchantMappings;

  if (transaction.categoryId) {
    return categories.find((category) => category.id === transaction.categoryId) ?? null;
  }

  return (
    sortCategoriesByPriority(categories).find((category) =>
      category.keywords.some((keyword) => description.includes(keyword.toLowerCase())),
    ) ?? null
  );
}
