import { Suspense } from "react";

import { TransactionsWorkspace } from "@/components/transactions-workspace";

export default function TransactionsPage() {
  return (
    <Suspense fallback={null}>
      <TransactionsWorkspace />
    </Suspense>
  );
}
