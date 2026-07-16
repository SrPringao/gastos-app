import { relations } from "drizzle-orm";
import {
  decimal,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Usuarios base (listo para conectar auth en el futuro)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email"),
  displayName: text("display_name"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cuentas / Metodos de pago (tarjetas, debito, efectivo)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type", { enum: ["credit", "debit", "cash"] }).notNull(),
  color: text("color"),
  imageUrl: text("image_url"),
  cutoffDay: integer("cutoff_day"),
  paymentDay: integer("payment_day"),
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categorias personalizadas
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Gastos / Transacciones
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // En centavos para evitar errores de punto flotante
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id, { onDelete: "restrict" }),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  date: timestamp("date").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Presupuesto mensual por usuario (monto en centavos)
export const monthlyBudgets = pgTable(
  "monthly_budgets",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // Formato recomendado: YYYY-MM
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userMonthUnique: uniqueIndex("monthly_budgets_user_month_unique").on(
      table.userId,
      table.month
    ),
  })
);

// Gastos fijos / recurrentes (no afectan métricas de gastos libres)
export const fixedExpenses = pgTable("fixed_expenses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  amount: integer("amount").notNull(), // en centavos
  dayOfMonth: integer("day_of_month"), // día esperado de pago (informativo)
  category: text("category"), // etiqueta libre opcional
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patrimonio: saldos positivos y deudas manuales, independientes de expenses/fixedExpenses
export const netWorthEntries = pgTable("net_worth_entries", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: integer("account_id").references(() => accounts.id, {
    onDelete: "set null",
  }),
  label: text("label").notNull(),
  kind: text("kind", { enum: ["asset", "debt"] }).notNull(),
  amount: integer("amount").notNull(), // en centavos
  dueDate: timestamp("due_date"), // fecha maxima de pago, solo aplica a deudas
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Patrimonio: líneas del simulador de gastos previstos
export const netWorthProjections = pgTable("net_worth_projections", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  amount: integer("amount").notNull(), // en centavos
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tokens de API para acceso externo (Atajos, automatizaciones)
export const apiTokens = pgTable("api_tokens", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  name: text("name"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Registro de pagos mensuales de gastos fijos
export const fixedExpensePayments = pgTable(
  "fixed_expense_payments",
  {
    id: serial("id").primaryKey(),
    fixedExpenseId: integer("fixed_expense_id")
      .notNull()
      .references(() => fixedExpenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: text("month").notNull(), // YYYY-MM
    paidAt: timestamp("paid_at").defaultNow().notNull(),
  },
  (table) => ({
    uniquePerMonth: uniqueIndex("fixed_expense_payments_unique").on(
      table.fixedExpenseId,
      table.month
    ),
  })
);

// Relaciones para joins
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  expenses: many(expenses),
  monthlyBudgets: many(monthlyBudgets),
  fixedExpenses: many(fixedExpenses),
  apiTokens: many(apiTokens),
  netWorthEntries: many(netWorthEntries),
  netWorthProjections: many(netWorthProjections),
}));

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, { fields: [apiTokens.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ many, one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  account: one(accounts),
  category: one(categories),
}));

export const monthlyBudgetsRelations = relations(monthlyBudgets, ({ one }) => ({
  user: one(users, {
    fields: [monthlyBudgets.userId],
    references: [users.id],
  }),
}));

export const fixedExpensesRelations = relations(fixedExpenses, ({ one, many }) => ({
  user: one(users, { fields: [fixedExpenses.userId], references: [users.id] }),
  payments: many(fixedExpensePayments),
}));

export const fixedExpensePaymentsRelations = relations(fixedExpensePayments, ({ one }) => ({
  fixedExpense: one(fixedExpenses, {
    fields: [fixedExpensePayments.fixedExpenseId],
    references: [fixedExpenses.id],
  }),
  user: one(users, { fields: [fixedExpensePayments.userId], references: [users.id] }),
}));

export const netWorthEntriesRelations = relations(netWorthEntries, ({ one }) => ({
  user: one(users, {
    fields: [netWorthEntries.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [netWorthEntries.accountId],
    references: [accounts.id],
  }),
}));

export const netWorthProjectionsRelations = relations(netWorthProjections, ({ one }) => ({
  user: one(users, {
    fields: [netWorthProjections.userId],
    references: [users.id],
  }),
}));

// Tipos para insert/select
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Account = InferSelectModel<typeof accounts>;
export type NewAccount = InferInsertModel<typeof accounts>;
export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;
export type Expense = InferSelectModel<typeof expenses>;
export type NewExpense = InferInsertModel<typeof expenses>;
export type MonthlyBudget = InferSelectModel<typeof monthlyBudgets>;
export type NewMonthlyBudget = InferInsertModel<typeof monthlyBudgets>;
export type FixedExpense = InferSelectModel<typeof fixedExpenses>;
export type NewFixedExpense = InferInsertModel<typeof fixedExpenses>;
export type FixedExpensePayment = InferSelectModel<typeof fixedExpensePayments>;
export type NewFixedExpensePayment = InferInsertModel<typeof fixedExpensePayments>;
export type ApiToken = InferSelectModel<typeof apiTokens>;
export type NewApiToken = InferInsertModel<typeof apiTokens>;
export type NetWorthEntry = InferSelectModel<typeof netWorthEntries>;
export type NewNetWorthEntry = InferInsertModel<typeof netWorthEntries>;
export type NetWorthProjection = InferSelectModel<typeof netWorthProjections>;
export type NewNetWorthProjection = InferInsertModel<typeof netWorthProjections>;
