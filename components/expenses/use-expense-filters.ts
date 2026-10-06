"use client";

import { useMemo, useState } from "react";
import { cleanMerchantName } from "@/lib/dashboard-metrics";
import { expenseDay, type MonthExpense } from "@/lib/expenses-metrics";

export type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

export const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Más reciente",
  "date-asc": "Más antiguo",
  "amount-desc": "Mayor monto",
  "amount-asc": "Menor monto",
};

/**
 * Filtros del Historial (misma logica que tenia ExpensesList): busqueda,
 * cuenta, categoria, fecha (un dia o rango) y orden.
 */
export function useExpenseFilters(expenses: MonthExpense[]) {
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortOption>("date-desc");

  const filtered = useMemo(() => {
    let result = [...expenses];

    const q = search.trim().toLocaleLowerCase("es-MX");
    if (q) {
      result = result.filter((e) => {
        const raw = (e.description ?? "").toLocaleLowerCase("es-MX");
        const clean = cleanMerchantName(e.description).name.toLocaleLowerCase("es-MX");
        return raw.includes(q) || clean.includes(q);
      });
    }
    if (accountFilter !== "all") {
      result = result.filter((e) => e.accountId === Number(accountFilter));
    }
    if (categoryFilter === "none") {
      result = result.filter((e) => e.categoryId === null);
    } else if (categoryFilter !== "all") {
      result = result.filter((e) => e.categoryId === Number(categoryFilter));
    }
    if (dateFrom && !dateTo) {
      // Un solo dia: filtra esa fecha exacta, no un rango abierto
      result = result.filter((e) => expenseDay(e) === dateFrom);
    } else {
      if (dateFrom) result = result.filter((e) => expenseDay(e) >= dateFrom);
      if (dateTo) result = result.filter((e) => expenseDay(e) <= dateTo);
    }

    const time = (e: MonthExpense) => new Date(e.date).getTime();
    result.sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return time(b) - time(a) || b.id - a.id;
        case "date-asc":
          return time(a) - time(b) || a.id - b.id;
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
      }
    });
    return result;
  }, [expenses, search, accountFilter, categoryFilter, dateFrom, dateTo, sort]);

  const hasFilters =
    search.trim() !== "" ||
    accountFilter !== "all" ||
    categoryFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "" ||
    sort !== "date-desc";

  function clearFilters() {
    setSearch("");
    setAccountFilter("all");
    setCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
    setSort("date-desc");
  }

  function setDateRange(from: string, to: string) {
    setDateFrom(from);
    setDateTo(to);
  }

  return {
    filtered,
    search,
    setSearch,
    accountFilter,
    setAccountFilter,
    categoryFilter,
    setCategoryFilter,
    dateFrom,
    dateTo,
    setDateRange,
    sort,
    setSort,
    hasFilters,
    clearFilters,
  };
}

export type ExpenseFilters = ReturnType<typeof useExpenseFilters>;
