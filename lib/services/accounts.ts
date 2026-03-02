import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getAccounts() {
  return db.select().from(accounts).orderBy(accounts.name);
}

export async function getAccountById(id: number) {
  const result = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, id))
    .limit(1);
  return result[0] ?? null;
}

export type CreateAccountInput = {
  name: string;
  type: "credit" | "debit" | "cash";
  color?: string | null;
  imageUrl?: string | null;
  cutoffDay?: number | null;
  paymentDay?: number | null;
  creditLimit?: string | null;
};

export type UpdateAccountInput = {
  name?: string;
  type?: "credit" | "debit" | "cash";
  color?: string | null;
  imageUrl?: string | null;
  cutoffDay?: number | null;
  paymentDay?: number | null;
  creditLimit?: string | null;
};

export async function createAccount(input: CreateAccountInput) {
  const { name, type, color, imageUrl, cutoffDay, paymentDay, creditLimit } =
    input;

  if (!name?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (!type || !["credit", "debit", "cash"].includes(type)) {
    return { error: "Tipo invalido" };
  }

  await db.insert(accounts).values({
    name: name.trim(),
    type,
    color: color ?? null,
    imageUrl: imageUrl ?? null,
    cutoffDay: type === "credit" ? cutoffDay ?? null : null,
    paymentDay: type === "credit" ? paymentDay ?? null : null,
    creditLimit: type === "credit" && creditLimit ? creditLimit : null,
  });

  return { success: true };
}

export async function updateAccount(id: number, input: UpdateAccountInput) {
  const existing = await getAccountById(id);
  if (!existing) {
    return { error: "Cuenta no encontrada" };
  }

  const { name, type, color, imageUrl, cutoffDay, paymentDay, creditLimit } =
    input;

  if (name !== undefined && !name?.trim()) {
    return { error: "El nombre es requerido" };
  }
  if (type && !["credit", "debit", "cash"].includes(type)) {
    return { error: "Tipo invalido" };
  }

  await db
    .update(accounts)
    .set({
      ...(name !== undefined && { name: name.trim() }),
      ...(type !== undefined && { type }),
      ...(color !== undefined && { color }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(cutoffDay !== undefined && {
        cutoffDay: type === "credit" || existing.type === "credit" ? cutoffDay : null,
      }),
      ...(paymentDay !== undefined && {
        paymentDay: type === "credit" || existing.type === "credit" ? paymentDay : null,
      }),
      ...(creditLimit !== undefined && {
        creditLimit:
          (type === "credit" || existing.type === "credit") && creditLimit
            ? creditLimit
            : null,
      }),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, id));

  return { success: true };
}
