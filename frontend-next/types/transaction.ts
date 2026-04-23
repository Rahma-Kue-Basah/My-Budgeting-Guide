export type TransactionType = "debit" | "credit";

export type CategoryColor =
  | "indigo"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "violet";

export type WorkspaceCategory = {
  id: string;
  name: string;
  color: CategoryColor;
  keywords: string[];
  priority: number;
};

export type MerchantMapping = {
  id: string;
  merchantKey: string;
  merchantName: string;
  categoryId: string | null;
  aliases: string[];
};

export type BudgetCategoryPlan = {
  categoryId: string;
  amount: number;
};

export type BudgetPlan = {
  id: string;
  month: string;
  incomeTarget: number;
  expenseTarget: number;
  savingsTarget: number;
  categoryPlans: BudgetCategoryPlan[];
  createdAt: string;
  updatedAt: string;
};

export type ParsedTransaction = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance: number | null;
  sourceFile: string;
  categoryId?: string | null;
};

export type UploadedPdfFile = {
  id: string;
  name: string;
  bank: string;
  rawText?: string;
  size: number;
  uploadedAt: string;
  statementPeriod: string | null;
  transactionCount: number;
  status: "processed" | "review";
  issueCount: number;
};

export type ImportActivity = {
  id: string;
  title: string;
  note: string;
  createdAt: string;
  tone: "success" | "warning";
};

export type FileWorkspaceState = {
  files: UploadedPdfFile[];
  transactions: ParsedTransaction[];
  activities: ImportActivity[];
  categories: WorkspaceCategory[];
  merchantMappings: MerchantMapping[];
  budgetPlans: BudgetPlan[];
};

export type ParsedPdfResult = {
  file: UploadedPdfFile;
  transactions: ParsedTransaction[];
  activity: ImportActivity;
};
