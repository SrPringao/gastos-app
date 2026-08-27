import { db } from "@/lib/db";
import { accounts, cardNameMappings, expenses } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { normalizeCardName } from "@/lib/utils/card-name";
import { getAccountById, getOrCreateUnassignedAccount } from "@/lib/services/accounts";

export async function resolveAccountIdFromCardName(
  userId: string,
  rawCardName: string
): Promise<number> {
  const normalized = normalizeCardName(rawCardName);

  const existing = await db
    .select()
    .from(cardNameMappings)
    .where(
      and(
        eq(cardNameMappings.userId, userId),
        eq(cardNameMappings.normalizedName, normalized)
      )
    )
    .limit(1);

  if (existing[0]) return existing[0].accountId;

  const unassigned = await getOrCreateUnassignedAccount(userId);
  return unassigned.id;
}

export async function getCardNameMappings(userId: string) {
  return db
    .select()
    .from(cardNameMappings)
    .where(eq(cardNameMappings.userId, userId))
    .orderBy(cardNameMappings.rawName);
}

export type UnassignedCardGroup = {
  rawCardName: string;
  count: number;
  totalAmount: number;
  lastDate: Date;
};

export async function getUnassignedCardGroups(
  userId: string
): Promise<UnassignedCardGroup[]> {
  const unassigned = await getOrCreateUnassignedAccount(userId);

  const rows = await db
    .select({
      rawCardName: expenses.rawCardName,
      count: sql<number>`COUNT(*)::int`,
      totalAmount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)::int`,
      lastDate: sql<Date>`MAX(${expenses.date})`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.userId, userId),
        eq(expenses.accountId, unassigned.id),
        sql`${expenses.rawCardName} IS NOT NULL`
      )
    )
    .groupBy(expenses.rawCardName)
    .orderBy(sql`MAX(${expenses.date}) DESC`);

  return rows
    .filter((r) => r.rawCardName !== null)
    .map((r) => ({
      rawCardName: r.rawCardName as string,
      count: r.count,
      totalAmount: r.totalAmount,
      lastDate: r.lastDate,
    }));
}

export type CreateMappingInput = {
  rawCardName: string;
  accountId: number;
  reassignExistingExpenses?: boolean;
};

export async function createOrUpdateMapping(
  userId: string,
  input: CreateMappingInput
): Promise<{ success: true; reassignedCount: number } | { error: string }> {
  const { rawCardName, accountId } = input;
  const reassign = input.reassignExistingExpenses ?? true;

  if (!rawCardName?.trim()) {
    return { error: "Nombre de tarjeta invalido" };
  }

  const account = await getAccountById(accountId);
  if (!account || account.userId !== userId) {
    return { error: "Cuenta no encontrada" };
  }

  const trimmedRawName = rawCardName.trim();
  const normalized = normalizeCardName(trimmedRawName);

  await db
    .insert(cardNameMappings)
    .values({
      userId,
      rawName: trimmedRawName,
      normalizedName: normalized,
      accountId,
    })
    .onConflictDoUpdate({
      target: [cardNameMappings.userId, cardNameMappings.normalizedName],
      set: { accountId, rawName: trimmedRawName, updatedAt: new Date() },
    });

  let reassignedCount = 0;
  if (reassign) {
    const unassigned = await getOrCreateUnassignedAccount(userId);
    const result = await db
      .update(expenses)
      .set({ accountId })
      .where(
        and(
          eq(expenses.userId, userId),
          eq(expenses.accountId, unassigned.id),
          sql`LOWER(TRIM(${expenses.rawCardName})) = ${normalized}`
        )
      )
      .returning({ id: expenses.id });
    reassignedCount = result.length;
  }

  return { success: true, reassignedCount };
}

export async function deleteMapping(userId: string, id: number) {
  const existing = await db
    .select()
    .from(cardNameMappings)
    .where(eq(cardNameMappings.id, id))
    .limit(1);

  if (!existing[0] || existing[0].userId !== userId) {
    return { error: "Mapeo no encontrado" };
  }

  await db.delete(cardNameMappings).where(eq(cardNameMappings.id, id));
  return { success: true };
}
