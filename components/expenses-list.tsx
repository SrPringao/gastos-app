"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CreditCardIcon, SearchIcon, ArrowUpDownIcon, XIcon } from "lucide-react";
import { EditExpenseModal } from "@/components/edit-expense-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { formatCurrency, formatDate } from "@/lib/utils/dates";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ExpenseWithDetails = {
  id: number;
  amount: number;
  date: string;
  description: string | null;
  accountId: number;
  categoryId: number | null;
  accountName: string;
  accountColor: string | null;
  accountImageUrl: string | null;
  categoryName: string | null;
};

type ExpensesListProps = {
  accounts: { id: number; name: string; type: string }[];
  categories: { id: number; name: string }[];
  monthKey?: string;
};

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const SORT_LABELS: Record<SortOption, string> = {
  "date-desc": "Más reciente",
  "date-asc": "Más antiguo",
  "amount-desc": "Mayor monto",
  "amount-asc": "Menor monto",
};

export function ExpensesList({ accounts, categories, monthKey }: ExpensesListProps) {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sort, setSort] = useState<SortOption>("date-desc");

  useEffect(() => {
    const url = monthKey
      ? `/api/expenses/list?limit=500&month=${monthKey}`
      : "/api/expenses/list?limit=500";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setExpenses(data);
      })
      .finally(() => setLoading(false));
  }, [monthKey]);

  function refreshList() {
    router.refresh();
    const url = monthKey
      ? `/api/expenses/list?limit=500&month=${monthKey}`
      : "/api/expenses/list?limit=500";
    fetch(url)
      .then((res) => res.json())
      .then(setExpenses);
  }

  const filtered = useMemo(() => {
    let result = [...expenses];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((e) =>
        (e.description ?? "").toLowerCase().includes(q)
      );
    }

    if (accountFilter !== "all") {
      result = result.filter((e) => e.accountId === Number(accountFilter));
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "none") {
        result = result.filter((e) => e.categoryId === null);
      } else {
        result = result.filter((e) => e.categoryId === Number(categoryFilter));
      }
    }

    result.sort((a, b) => {
      switch (sort) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
      }
    });

    return result;
  }, [expenses, search, accountFilter, categoryFilter, sort]);

  const hasActiveFilters =
    search.trim() !== "" || accountFilter !== "all" || categoryFilter !== "all" || sort !== "date-desc";

  function clearFilters() {
    setSearch("");
    setAccountFilter("all");
    setCategoryFilter("all");
    setSort("date-desc");
  }

  // Categorías presentes en los gastos del mes
  const presentCategoryIds = useMemo(
    () => new Set(expenses.map((e) => e.categoryId)),
    [expenses]
  );
  const presentCategories = categories.filter(
    (c) => presentCategoryIds.has(c.id)
  );

  const presentAccountIds = useMemo(
    () => new Set(expenses.map((e) => e.accountId)),
    [expenses]
  );
  const presentAccounts = accounts.filter((a) => presentAccountIds.has(a.id));

  // Total de los gastos filtrados
  const filteredTotal = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  if (loading) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Cargando gastos...
      </p>
    );
  }

  if (expenses.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No hay gastos registrados.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-3">
        {/* Búsqueda */}
        <div className="relative">
          <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            placeholder="Buscar por descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filtro por cuenta */}
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger className="w-auto min-w-[160px]">
              <SelectValue placeholder="Método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              {presentAccounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro por categoría */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-auto min-w-[160px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="none">Sin categoría</SelectItem>
              {presentCategories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ordenar */}
          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="w-auto min-w-[160px]">
              <ArrowUpDownIcon className="mr-2 size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground gap-1"
            >
              <XIcon className="size-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {filtered.length === expenses.length
            ? `${expenses.length} transacciones`
            : `${filtered.length} de ${expenses.length} transacciones`}
        </p>
        {filtered.length > 0 && (
          <Badge variant="secondary" className="font-medium">
            Total: {formatCurrency(filteredTotal)}
          </Badge>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No hay gastos con los filtros aplicados.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((exp) => (
            <div
              key={exp.id}
              className="border-border flex min-h-[60px] items-center justify-between gap-3 rounded-lg border bg-background/50 p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                  {exp.accountImageUrl ? (
                    <img
                      src={exp.accountImageUrl}
                      alt={exp.accountName}
                      className="size-8 rounded object-cover"
                    />
                  ) : (
                    <CreditCardIcon
                      className="size-5"
                      style={
                        exp.accountColor
                          ? { color: exp.accountColor }
                          : { color: "var(--muted-foreground)" }
                      }
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">
                    {exp.description || "Sin descripcion"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {exp.accountName}
                    {exp.categoryName && ` - ${exp.categoryName}`}
                    {" - "}
                    {formatDate(exp.date)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="font-medium">{formatCurrency(exp.amount)}</span>
                <EditExpenseModal
                  expense={exp}
                  accounts={accounts}
                  categories={categories}
                  onSuccess={refreshList}
                />
                <DeleteExpenseButton
                  expenseId={exp.id}
                  description={exp.description}
                  onSuccess={refreshList}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
