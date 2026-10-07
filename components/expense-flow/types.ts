import type { RecentMerchant, TopMethod } from "@/lib/expense-suggestions";

/** Estado unico del flujo; se conserva al ir y volver entre pasos */
export type ExpenseDraft = {
  amount: string;
  note: string;
  /** Comercio elegido en Recientes (solo interno) */
  merchantKey: string | null;
  methodId: number | null;
  /** YYYY-MM-DD */
  date: string;
  dateMode: "today" | "yesterday" | "other";
  categoryId: number | null;
  /** El metodo vino precargado por un chip de Recientes */
  methodFromRecent: boolean;
};

export type Suggestions = {
  recents: RecentMerchant[];
  topMethods: TopMethod[];
  usage: { methods: Record<number, number>; categories: Record<number, number> };
};

export type FlowMethod = {
  id: number;
  name: string;
  type: "credit" | "debit" | "cash";
  color: string | null;
};

export type FlowCategory = { id: number; name: string };
