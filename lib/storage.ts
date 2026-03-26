import type { StoredDashboardState } from "@/types/transaction";

export const DASHBOARD_STORAGE_KEY = "bca-mutation-dashboard-state-v3";

export const emptyDashboardState: StoredDashboardState = {
  transactions: [],
  uploadedFiles: [],
  lastUpdatedAt: null,
};
