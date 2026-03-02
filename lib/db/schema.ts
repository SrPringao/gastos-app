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

// Relaciones para joins
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  expenses: many(expenses),
  monthlyBudgets: many(monthlyBudgets),
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
